const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// 🔍 SEARCH
const searchItems = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;

  const offset = (page - 1) * limit;

  let dataQuery;
  let countQuery;
  let params;

  if (q && q.trim() !== '') {
    dataQuery = `
      SELECT *
      FROM items_overview
      WHERE 
        name ILIKE '%' || $1 || '%' OR
        brand ILIKE '%' || $1 || '%' OR
        subcategory ILIKE '%' || $1 || '%'
      ORDER BY name
      LIMIT $2 OFFSET $3
    `;

    countQuery = `
      SELECT COUNT(*) 
      FROM items_overview
      WHERE 
        name ILIKE '%' || $1 || '%' OR
        brand ILIKE '%' || $1 || '%' OR
        subcategory ILIKE '%' || $1 || '%'
    `;

    params = [q, limit, offset];

  } else {
    dataQuery = `
      SELECT *
      FROM items_overview
      ORDER BY name
      LIMIT $1 OFFSET $2
    `;

    countQuery = `SELECT COUNT(*) FROM items_overview`;

    params = [limit, offset];
  }

  const dataResult = await pool.query(dataQuery, params);
  const countResult = await pool.query(
    countQuery,
    q && q.trim() !== '' ? [q] : []
  );

  res.json({
    data: dataResult.rows,
    total: parseInt(countResult.rows[0].count),
    page: Number(page),
    limit: Number(limit)
  });
});


// 💡 SUGGESTIONS
const getSuggestions = asyncHandler(async (req, res) => {
  const { q = '' } = req.query;

  if (!q.trim()) return res.json([]);

  const query = `
    SELECT id, name, brand, subcategory
    FROM items_overview
    WHERE 
      name ILIKE $1 OR
      brand ILIKE $1 OR
      subcategory ILIKE $1
    ORDER BY 
      CASE 
        WHEN name ILIKE $2 THEN 1
        WHEN brand ILIKE $2 THEN 2
        WHEN subcategory ILIKE $2 THEN 3
        ELSE 4
      END,
      name
    LIMIT 10
  `;

  const values = [`%${q}%`, `${q}%`];

  const { rows } = await pool.query(query, values);

  res.json(rows);
});


// 📦 GET ITEM BY ID
const getItemById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    throw new AppError('Invalid item id', 400);
  }

  const { rows } = await pool.query(
    `SELECT 
       i.id,
       i.name,
       i.quantity,
       b.name AS brand,
       s.name AS subcategory,
       c.name AS category,
       i.total_items_sold,
       i.warranty_months,
       i.mrp,
       i.reorder_level,
       i.description,
       i.net_buy_price
     FROM items i
     LEFT JOIN brands b ON i.brand_id = b.id
     LEFT JOIN subcategories s ON i.subcategory_id = s.id
     LEFT JOIN categories c ON i.category_id = c.id
     WHERE i.id = $1`,
    [id]
  );

  if (rows.length === 0) {
    throw new AppError('Item not found', 404);
  }

  res.json(rows[0]);
});

module.exports = {
  searchItems,
  getSuggestions,
  getItemById
};