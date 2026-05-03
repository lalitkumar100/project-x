const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const {
  findWholesalerByGst,
  getItemById,
  findOrCreateBrand,
  findOrCreateCategory,
  findOrCreateSubcategory,
  createItem,
} = require('../services/purchaseServies');

const createPurchase = asyncHandler(async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      wholesaler,
      invoice_id,
      billing_type,
      billing_date,
      delivered_date,
      grand_total,
      items = [],
    } = req.body;

    if (!wholesaler?.gst_no) throw new AppError('Wholesaler GST number is required', 400);
    if (!invoice_id) throw new AppError('invoice_id is required', 400);
    if (!['inter', 'outer'].includes(String(billing_type || '').toLowerCase())) {
      throw new AppError('billing_type must be either inter or outer', 400);
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError('At least one purchase item is required', 400);
    }

    await client.query('BEGIN');

    const wholesalerRow = await findWholesalerByGst(client, wholesaler.gst_no);
    if (!wholesalerRow) {
      throw new AppError(`No wholesaler found with GST ${wholesaler.gst_no}`, 400);
    }

    if (
      wholesaler?.name &&
      wholesalerRow.name?.trim().toLowerCase() !== String(wholesaler.name).trim().toLowerCase()
    ) {
      throw new AppError('Wholesaler name does not match the provided GST number', 400);
    }

    const purchaseInsert = await client.query(
      `INSERT INTO purchases (
        wholesaler_id,
        invoice_number,
        billing_type,
        total_amount,
        billing_date,
        delivered_date
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id`,
      [
        wholesalerRow.id,
        invoice_id,
        String(billing_type).toLowerCase(),
        Number(grand_total || 0),
        billing_date || null,
        delivered_date || null,
      ]
    );

    const purchaseId = purchaseInsert.rows[0].id;
    const processedItems = [];

    for (const row of items) {
      let itemId = row.item_id ? Number(row.item_id) : null;

      if (itemId) {
        const existingItem = await getItemById(client, itemId);
        if (!existingItem) {
          throw new AppError(`Invalid item_id ${row.item_id}. Item does not exist`, 400);
        }

        await client.query(
          `UPDATE items
           SET quantity = COALESCE(quantity, 0) + $1,
               mrp = COALESCE($2, mrp),
               net_buy_price = COALESCE($3, net_buy_price),
               warranty_months = COALESCE($4, warranty_months)
           WHERE id = $5`,
          [
            Number(row.quantity || 0),
            row.mrp !== undefined ? Number(row.mrp) : null,
            row.purchase_price !== undefined ? Number(row.purchase_price) : null,
            row.warranty_months !== undefined ? Number(row.warranty_months) : null,
            itemId,
          ]
        );
      } else {
        const brandId = await findOrCreateBrand(client, row.brand);
        const categoryId = await findOrCreateCategory(client, row.category);
        const subcategoryId = await findOrCreateSubcategory(client, row.subcategory, categoryId);

        itemId = await createItem(client, row, {
          brandId,
          categoryId,
          subcategoryId,
        });
      }

      const quantity = Number(row.quantity || 0);
      const buyPrice = Number(row.purchase_price || 0);
      const totalPrice = row.line_total !== undefined ? Number(row.line_total) : quantity * buyPrice;

      await client.query(
        `INSERT INTO purchase_items (
          purchase_id,
          item_id,
          quantity,
          buy_price,
          total_price
        ) VALUES ($1, $2, $3, $4, $5)`,
        [purchaseId, itemId, quantity, buyPrice, totalPrice]
      );

      processedItems.push({
        item_id: itemId,
        quantity,
        buy_price: buyPrice,
        total_price: totalPrice,
      });
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Purchase created successfully',
      data: {
        purchase_id: purchaseId,
        invoice_number: invoice_id,
        wholesaler_id: wholesalerRow.id,
        processed_items: processedItems,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

module.exports = {
  createPurchase,
};