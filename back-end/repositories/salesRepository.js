const findCustomerById = async (client, customerId) => {
  const { rows } = await client.query(
    `SELECT id FROM customers WHERE id = $1 LIMIT 1`,
    [customerId]
  );
  return rows[0] || null;
};

const findCustomerByPhone = async (client, phone) => {
  const { rows } = await client.query(
    `SELECT c.id
     FROM customers c
     INNER JOIN customer_phones cp ON cp.customer_id = c.id
     WHERE cp.phone = $1
     LIMIT 1`,
    [phone]
  );
  return rows[0] || null;
};

const createCustomer = async (client, customer) => {
  const createdCustomer = await client.query(
    `INSERT INTO customers (name, email)
     VALUES ($1, $2)
     RETURNING id`,
    [customer.name, customer.email || null]
  );

  const customerId = createdCustomer.rows[0].id;

  await client.query(
    `INSERT INTO customer_phones (customer_id, phone, label)
     VALUES ($1, $2, $3)`,
    [customerId, customer.phone, 'Primary']
  );

  return customerId;
};

const findEmployeeById = async (client, employeeId) => {
  const { rows } = await client.query(
    `SELECT id FROM employees WHERE id = $1 LIMIT 1`,
    [employeeId]
  );
  return rows[0] || null;
};

const lockItemForSale = async (client, itemId) => {
  const { rows } = await client.query(
    `SELECT
        i.id,
        i.quantity,
        i.net_buy_price,
        i.name,
        b.name AS brand,
        c.name AS category,
        s.name AS subcategory
     FROM items i
     LEFT JOIN brands b ON b.id = i.brand_id
     LEFT JOIN categories c ON c.id = i.category_id
     LEFT JOIN subcategories s ON s.id = i.subcategory_id
     WHERE i.id = $1
     FOR UPDATE OF i`,
    [itemId]
  );
  return rows[0] || null;
};

const insertSale = async (client, sale) => {
  const { rows } = await client.query(
    `INSERT INTO sales (
      customer_id,
      employee_id,
      customer_type,
      billing_type,
      total_amount,
      extra_cost,
      transport_cost,
      final_amount,
      payment_method,
      payment_status,
      billing_date,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id`,
    [
      sale.customer_id,
      sale.employee_id,
      sale.customer_type,
      sale.billing_type,
      sale.total_amount,
      sale.extra_cost,
      sale.transport_cost,
      sale.final_amount,
      sale.payment_method,
      sale.payment_status,
      sale.billing_date,
      sale.status
    ]
  );

  return rows[0].id;
};

const updateInvoiceNumber = async (client, saleId, invoiceNumber) => {
  await client.query(
    `UPDATE sales SET invoice_number = $1 WHERE id = $2`,
    [invoiceNumber, saleId]
  );
};

const insertSaleItem = async (client, saleId, item) => {
  await client.query(
    `INSERT INTO sales_items (
      sale_id,
      item_id,
      quantity,
      sell_price,
      total_price,
      discount,
      tax_amount
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      saleId,
      item.item_id,
      item.quantity,
      item.sell_price,
      item.total_price,
      item.discount,
      item.tax_amount
    ]
  );
};

const updateItemStock = async (client, itemId, quantity) => {
  await client.query(
    `UPDATE items
     SET quantity = quantity - $1,
         total_items_sold = COALESCE(total_items_sold, 0) + $1
     WHERE id = $2`,
    [quantity, itemId]
  );
};

const updateBlockchainStatus = async (saleId, status, transactionId = null) => {
  await clientlessQuery(
    `UPDATE sales
     SET blockchain_status = $1,
         blockchain_txn_id = $2
     WHERE id = $3`,
    [status, transactionId, saleId]
  );
};

let pool;
const clientlessQuery = async (query, params) => {
  if (!pool) {
    pool = require('../config/db');
  }
  return pool.query(query, params);
};

module.exports = {
  findCustomerById,
  findCustomerByPhone,
  createCustomer,
  findEmployeeById,
  lockItemForSale,
  insertSale,
  updateInvoiceNumber,
  insertSaleItem,
  updateItemStock,
  updateBlockchainStatus
};
