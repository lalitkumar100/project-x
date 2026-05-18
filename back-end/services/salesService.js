const pool = require('../config/db');
const AppError = require('../utils/AppError');
const salesRepository = require('../repositories/salesRepository');
const axios = require('axios');
const fs = require('fs');
const path = require('path');


const normalizeString = (value) => String(value || '').trim();

const toNumber = (value, fieldName) => {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new AppError(`${fieldName} must be a valid number`, 400);
  }
  return number;
};

const toPositiveInteger = (value, fieldName) => {
  const number = toNumber(value, fieldName);
  if (!Number.isInteger(number) || number <= 0) {
    throw new AppError(`${fieldName} must be a positive integer`, 400);
  }
  return number;
};

const TCG_CONFIG_PATH = path.resolve(__dirname, '../TCG_Config.json');

const getTcgConfig = () => {
  let token = normalizeString(process.env.TCG_TOKEN);

  try {
    if (fs.existsSync(TCG_CONFIG_PATH)) {
      const raw = fs.readFileSync(TCG_CONFIG_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (data.TCG_token) {
        token = data.TCG_token;
      }
    }
  } catch (error) {
    console.error('[SalesService] Error reading TCG token from config file:', error.message);
  }


  return {
    serverUrl: normalizeString(process.env.TCG_SERVER_URL || process.env.TCG_URL).replace(/\/$/, ''),
    token
  };
};


const isTcgAuthError = (error) => {
  const status = error.response?.status;
  return status === 401 || status === 403;
};

const validateTcgUser = async (tcgId, overrideToken = null) => {
  const { serverUrl, token: configToken } = getTcgConfig();
  const token = (overrideToken && overrideToken !== 'null') ? overrideToken : configToken;

  if (!serverUrl || !token) {
    console.error('[SalesService] TCG Authentication failed: Missing serverUrl or token', { serverUrl, hasToken: !!token });
    throw new AppError('TCG authentication failed', 502);
  }

  try {
    const { data } = await axios.get(`${serverUrl}/v1/api/users/${tcgId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (data?.message === 'User not found') {
      throw new AppError('Invalid TCG ID', 400);
    }

    return data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (isTcgAuthError(error)) {
      throw new AppError('TCG authentication failed', 502);
    }
    if (error.response?.status === 404 || error.response?.data?.message === 'User not found') {
      throw new AppError('Invalid TCG ID', 400);
    }
    throw new AppError(error.response?.data?.message || 'TCG verification failed', 502);
  }
};

const postBlockchainTransaction = async ({ tcgId, invoiceNumber, finalAmount, items }, overrideToken = null) => {
  const { serverUrl, token: configToken } = getTcgConfig();
  const token = (overrideToken && overrideToken !== 'null') ? overrideToken : configToken;

  if (!serverUrl || !token) {
    console.error('[SalesService] TCG Authentication failed during transaction: Missing token', { serverUrl, hasToken: !!token });
    throw new AppError('TCG authentication failed', 502);
  }

  try {
    const { data } = await axios.post(`${serverUrl}/v1/api/transactions`, {
      receiver_id: tcgId,
      invoice_data: {
        amount: finalAmount,
        invoice_number: invoiceNumber,
        items: items.map((item) => ({
          item_id: item.item_id,
          name: item.name,
          brand: item.brand,
          category: item.category,
          subcategory: item.subcategory,
          qty: item.quantity,
          rate: item.sell_price,
          buy_price: item.net_buy_price
        }))
      }
    }, {
      headers: {
      Authorization: `Bearer ${token}`
      }
    });

    return data;
  } catch (error) {
    if (isTcgAuthError(error)) {
      throw new AppError('TCG authentication failed', 502);
    }
    throw new AppError(error.response?.data?.message || 'Blockchain transaction failed', 502);
  }
};


const validateSalePayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw new AppError('Request body is required', 400);
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new AppError('items must contain at least one item', 400);
  }

  const paymentMethod = normalizeString(payload.payment?.method);
  const paymentStatus = normalizeString(payload.payment?.status);
  const billingStatus = normalizeString(payload.meta?.status);
  const billingDate = normalizeString(payload.meta?.billing_date);

  if (!['cash', 'UPI', 'card'].includes(paymentMethod)) {
    throw new AppError('payment.method must be cash, UPI, or card', 400);
  }
  if (!['paid', 'pending'].includes(paymentStatus)) {
    throw new AppError('payment.status must be paid or pending', 400);
  }
  if (billingStatus && billingStatus !== 'completed') {
    throw new AppError('meta.status must be completed', 400);
  }
  if (!billingDate || !/^\d{4}-\d{2}-\d{2}$/.test(billingDate)) {
    throw new AppError('meta.billing_date must be YYYY-MM-DD', 400);
  }

  const employeeId = payload.meta?.employee_id
    ? toPositiveInteger(payload.meta.employee_id, 'meta.employee_id')
    : null;

  return {
    total_amount: toNumber(payload.summary?.total_amount, 'summary.total_amount'),
    extra_cost: toNumber(payload.summary?.extra_cost || 0, 'summary.extra_cost'),
    transport_cost: toNumber(payload.summary?.transport_cost || 0, 'summary.transport_cost'),
    final_amount: toNumber(payload.summary?.final_amount, 'summary.final_amount'),
    payment_method: paymentMethod,
    payment_status: paymentStatus,
    employee_id: employeeId,
    billing_date: billingDate,
    status: billingStatus || 'completed'
  };
};

const validateWholesaleTcg = async (customer, overrideToken = null) => {

  const tcgVerification = Boolean(customer?.tcg_verification ?? customer?.tcg_verified);

  if (!tcgVerification) {
    return {
      tcg_id: null,
      tcg_verification: false
    };
  }

  if (!customer?.tcg_id) {
    throw new AppError('tcg_id is required when TCG verification is true', 400);
  }

  const tcgId = toPositiveInteger(customer.tcg_id, 'customer.tcg_id');
  await validateTcgUser(tcgId, overrideToken);


  return {
    tcg_id: tcgId,
    tcg_verification: true
  };
};

const resolveCustomerId = async (client, customer) => {
  const customerType = normalizeString(customer?.type).toLowerCase();

  if (customerType === 'unregistered') {
    // Ensure the default "Unregistered" customer exists with ID 1
    const { rows } = await client.query('SELECT id FROM customers WHERE id = 1');
    if (rows.length === 0) {
      await client.query(`
        INSERT INTO customers (id, name)
        VALUES (1, 'Unregistered')
        ON CONFLICT (id) DO NOTHING
      `);
      await client.query(`SELECT setval('customers_id_seq', COALESCE((SELECT MAX(id) FROM customers), 1), true)`);
    }
    return 1;
  }

  if (customerType !== 'registered') {
    throw new AppError('customer.type must be registered or unregistered', 400);
  }

  const name = normalizeString(customer?.name);
  const phone = normalizeString(customer?.phone);
  const email = normalizeString(customer?.email);

  if (!name) throw new AppError('Customer name is required for registered customer', 400);
  if (!phone) throw new AppError('Customer phone is required for registered customer', 400);

  if (customer?.id) {
    const requestedCustomerId = toPositiveInteger(customer.id, 'customer.id');
    const existingById = await salesRepository.findCustomerById(client, requestedCustomerId);
    if (existingById) return existingById.id;
  }

  const existingByPhone = await salesRepository.findCustomerByPhone(client, phone);
  if (existingByPhone) return existingByPhone.id;

  return salesRepository.createCustomer(client, { name, phone, email });
};

const validateEmployee = async (client, employeeId) => {
  if (employeeId === null) return;

  const employee = await salesRepository.findEmployeeById(client, employeeId);
  if (!employee) {
    throw new AppError(`Employee ${employeeId} not found`, 400);
  }
};

const lockAndValidateItem = async (client, saleItem) => {
  const itemId = toPositiveInteger(saleItem.item_id, 'item_id');
  const quantity = toPositiveInteger(saleItem.quantity, `quantity for item ${itemId}`);
  const sellPrice = toNumber(saleItem.sell_price, 'sell_price');
  const discount = toNumber(saleItem.discount || 0, 'discount');
  const taxAmount = toNumber(saleItem.tax_amount || 0, 'tax_amount');

  if (sellPrice < 0) throw new AppError(`Invalid sell_price for item ${itemId}`, 400);
  if (discount < 0) throw new AppError(`Invalid discount for item ${itemId}`, 400);
  if (taxAmount < 0) throw new AppError(`Invalid tax_amount for item ${itemId}`, 400);

  const item = await salesRepository.lockItemForSale(client, itemId);
  if (!item) {
    throw new AppError(`Item ${itemId} not found`, 400);
  }

  const availableQuantity = Number(item.quantity || 0);
  const buyPrice = Number(item.net_buy_price || 0);

  if (quantity > availableQuantity) {
    throw new AppError(`Insufficient stock for item ${itemId}`, 400);
  }

  if (sellPrice < buyPrice) {
    throw new AppError(`sell_price cannot be less than buy price for item ${itemId}`, 400);
  }

  return {
    item_id: itemId,
    name: item.name,
    brand: item.brand,
    category: item.category,
    subcategory: item.subcategory,
    quantity,
    sell_price: sellPrice,
    net_buy_price: buyPrice,
    discount,
    tax_amount: taxAmount,
    total_price: quantity * sellPrice - discount + taxAmount
  };
};

const buildInvoiceNumber = (billingDate, saleId) => (
  `INV-${new Date(billingDate).getFullYear()}-${String(saleId).padStart(4, '0')}`
);

const createSale = async (payload, billingType, options = {}) => {
  const saleData = validateSalePayload(payload);
  const tcg = options.enableTcg ? await validateWholesaleTcg(payload.customer, payload.token) : {

    tcg_id: null,
    tcg_verification: false
  };
  const client = await pool.connect();

  let committedSale = null;

  try {
    await client.query('BEGIN');

    const customerId = await resolveCustomerId(client, payload.customer);
    const customerType = normalizeString(payload.customer?.type).toLowerCase();

    await validateEmployee(client, saleData.employee_id);

    const saleItems = [];
    for (const row of payload.items) {
      saleItems.push(await lockAndValidateItem(client, row));
    }

    const blockchainStatus = tcg.tcg_verification ? 'pending' : null;
    const saleId = await salesRepository.insertSale(client, {
      customer_id: customerId,
      employee_id: saleData.employee_id,
      customer_type: customerType,
      billing_type: billingType,
      total_amount: saleData.total_amount,
      extra_cost: saleData.extra_cost,
      transport_cost: saleData.transport_cost,
      final_amount: saleData.final_amount,
      payment_method: saleData.payment_method,
      payment_status: saleData.payment_status,
      billing_date: saleData.billing_date,
      status: saleData.status,
      blockchain_status: blockchainStatus
    });

    const invoiceNumber = buildInvoiceNumber(saleData.billing_date, saleId);
    await salesRepository.updateInvoiceNumber(client, saleId, invoiceNumber);

    for (const item of saleItems) {
      await salesRepository.insertSaleItem(client, saleId, item);
      await salesRepository.updateItemStock(client, item.item_id, item.quantity);
    }

    await client.query('COMMIT');

    committedSale = {
      sale_id: saleId,
      invoice_number: invoiceNumber,
      customer_id: customerId,
      final_amount: saleData.final_amount,
      items: saleItems,
      blockchain_status: blockchainStatus || 'skipped'
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  if (tcg.tcg_verification) {
    try {
      const blockchainResult = await postBlockchainTransaction({
        tcgId: tcg.tcg_id,
        invoiceNumber: committedSale.invoice_number,
        finalAmount: committedSale.final_amount,
        items: committedSale.items
      }, payload.token);


      const transactionId = blockchainResult?.transaction_id
        || blockchainResult?.txn_id
        || blockchainResult?.id
        || null;

      await salesRepository.updateBlockchainStatus(committedSale.sale_id, 'success', transactionId);
      committedSale.blockchain_status = 'success';
      committedSale.blockchain_txn_id = transactionId;
    } catch (error) {
      await salesRepository.updateBlockchainStatus(committedSale.sale_id, 'failed');
      committedSale.blockchain_status = 'failed';
      committedSale.blockchain_error = error.message;
    }
  }

  return {
    sale_id: committedSale.sale_id,
    invoice_number: committedSale.invoice_number,
    customer_id: committedSale.customer_id,
    blockchain_status: committedSale.blockchain_status,
    ...(committedSale.blockchain_txn_id ? { blockchain_txn_id: committedSale.blockchain_txn_id } : {}),
    ...(committedSale.blockchain_error ? { blockchain_error: committedSale.blockchain_error } : {})
  };
};

const createRetailSale = (payload) => createSale(payload, 'retail');

const createWholesaleSale = (payload) => createSale(payload, 'wholesale', { enableTcg: true });

const createWholesalerSale = createWholesaleSale;

const resolveRequestItems = async (items) => {
  if (!Array.isArray(items)) return { matched: [], unmatched: [] };

  const matched = [];
  const unmatched = [];

  for (const item of items) {
    const itemName = normalizeString(item.name);
    
    // Try to find a exact or close match by name
    const query = `
      SELECT id, name, brand, subcategory, quantity as stock, mrp as selling_price, net_buy_price
      FROM items_overview
      WHERE LOWER(name) = LOWER($1)
      LIMIT 1;
    `;
    
    const { rows } = await pool.query(query, [itemName]);
    
    if (rows.length > 0) {
      const dbItem = rows[0];
      matched.push({
        item_id: dbItem.id,
        name: dbItem.name,
        quantity: Number(item.quantity || 1),
        stock: Number(dbItem.stock || 0),
        selling_price: Number(dbItem.selling_price || 0),
        net_buy_price: Number(dbItem.net_buy_price || 0)
      });
    } else {
      unmatched.push(item);
    }
  }

  return { matched, unmatched };
};

module.exports = {
  createRetailSale,
  createWholesaleSale,
  createWholesalerSale,
  resolveRequestItems
};
