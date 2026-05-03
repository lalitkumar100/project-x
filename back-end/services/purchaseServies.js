const AppError = require("../utils/AppError");

const normalizeName = (value) => String(value || "").trim();

const findWholesalerByGst = async (client, gstNo) => {
  const { rows } = await client.query(
    `SELECT id, name, gst_no
     FROM contacts
     WHERE contact_type = 'wholesaler' AND gst_no = $1
     LIMIT 1`,
    [gstNo]
  );
  return rows[0] || null;
};

const getItemById = async (client, itemId) => {
  const { rows } = await client.query(
    `SELECT id, quantity
     FROM items
     WHERE id = $1
     LIMIT 1`,
    [itemId]
  );
  return rows[0] || null;
};

const findOrCreateBrand = async (client, brandName) => {
  const name = normalizeName(brandName);
  if (!name) throw new AppError("Brand is required when item_id is not provided", 400);

  const existing = await client.query(
    `SELECT id FROM brands WHERE LOWER(name) = LOWER($1) LIMIT 1`,
    [name]
  );
  if (existing.rows.length) return existing.rows[0].id;

  const created = await client.query(
    `INSERT INTO brands (name) VALUES ($1) RETURNING id`,
    [name]
  );
  return created.rows[0].id;
};

const findOrCreateCategory = async (client, categoryName) => {
  const name = normalizeName(categoryName);
  if (!name) throw new AppError("Category is required when item_id is not provided", 400);

  const existing = await client.query(
    `SELECT id FROM categories WHERE LOWER(name) = LOWER($1) LIMIT 1`,
    [name]
  );
  if (existing.rows.length) return existing.rows[0].id;

  const created = await client.query(
    `INSERT INTO categories (name) VALUES ($1) RETURNING id`,
    [name]
  );
  return created.rows[0].id;
};

const findOrCreateSubcategory = async (client, subcategoryName, categoryId) => {
  const name = normalizeName(subcategoryName);
  if (!name) throw new AppError("Subcategory is required when item_id is not provided", 400);

  const existing = await client.query(
    `SELECT id
     FROM subcategories
     WHERE LOWER(name) = LOWER($1) AND category_id = $2
     LIMIT 1`,
    [name, categoryId]
  );
  if (existing.rows.length) return existing.rows[0].id;

  const created = await client.query(
    `INSERT INTO subcategories (name, category_id)
     VALUES ($1, $2)
     RETURNING id`,
    [name, categoryId]
  );
  return created.rows[0].id;
};

const createItem = async (client, itemPayload, ids) => {
  const itemName = normalizeName(itemPayload.item_name);
  if (!itemName) throw new AppError("Item name is required for new item creation", 400);

  const quantity = Number(itemPayload.quantity || 0);
  const purchasePrice = Number(itemPayload.purchase_price || 0);
  const mrp = Number(itemPayload.mrp || 0);
  const warrantyMonths = Number(itemPayload.warranty_months || 0);

  const created = await client.query(
    `INSERT INTO items (
      name, brand_id, category_id, subcategory_id,
      quantity, mrp, net_buy_price, warranty_months, total_items_sold
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0)
    RETURNING id`,
    [
      itemName,
      ids.brandId,
      ids.categoryId,
      ids.subcategoryId,
      quantity,
      mrp,
      purchasePrice,
      warrantyMonths,
    ]
  );
  return created.rows[0].id;
};

module.exports = {
  findWholesalerByGst,
  getItemById,
  findOrCreateBrand,
  findOrCreateCategory,
  findOrCreateSubcategory,
  createItem,
};
