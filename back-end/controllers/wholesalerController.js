const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

//import serives
const {
  checkDuplicateGst,
  checkDuplicateEmail,
  isPhoneDuplicate
} = require('../services/wholesalerServies');


/**
 * Express controller to send Wholesaler list .
 * Handles transaction-based insertion for contacts, phones, and addresses.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>}
 */
const searchWholesalers = asyncHandler(async (req, res) => {
  const { q = '' } = req.query;
  const search = q.trim();

  let query;
  let params = [];

  if (search === '') {
    query = 'SELECT * FROM wholesaler_all';
  } else {
    query = `
      SELECT * 
      FROM wholesaler_all 
      WHERE 
        name ILIKE $1 OR 
        city ILIKE $2 OR 
        gst_no ILIKE $3
    `;
    params = [`%${search}%`, `%${search}%`, `%${search}%`];
  }

  const result = await pool.query(query, params);
  const rows = result.rows;

  res.status(200).json({
    status: 'success',
    count: rows.length,
    data: {
      wholesalers: rows,
    },
  });
});

/**
 * @desc Get wholesaler search suggestions (name, gst, email)
 * @route GET /api/wholesalers/suggestions?q=searchText
 * @access Public/Private
 */
const getWholesalerSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;

    // 🔎 Validate query
    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const search = `%${q.trim().toLowerCase()}%`;

    const query = `
      SELECT 
        id,
        name,
        email,
        gst_no
      FROM contacts
      WHERE contact_type = 'wholesaler'
        AND (
          LOWER(name) LIKE $1 OR
          LOWER(email) LIKE $1 OR
          LOWER(gst_no) LIKE $1
        )
      ORDER BY name ASC
      LIMIT 10;
    `;

    const { rows } = await pool.query(query, [search]);

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });

  } catch (error) {
    next(error);
  }
};


/**
 * Express controller to create a new Wholesaler.
 * Handles transaction-based insertion for contacts, phones, and addresses.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>}
 */
const addWholesaler = asyncHandler(async (req, res) => {
  const client = await pool.connect();

  try {
    const { name, email, gst_no, phones = [], addresses = [] } = req.body;
    const TYPE = 'wholesaler';

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    await client.query('BEGIN');

    // 🔍 Validate GST
    const gstError = await checkDuplicateGst(client, gst_no, TYPE);
    if (gstError) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: gstError });
    }

    // 🔍 Validate Email
    const emailError = await checkDuplicateEmail(client, email, TYPE);
    if (emailError) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: emailError });
    }

    // ✅ Insert Contact
    const contactResult = await client.query(
      `INSERT INTO contacts (name, email, gst_no, contact_type)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [name, email, gst_no, TYPE]
    );

    const contactId = contactResult.rows[0].id;

    // 📱 Insert Phones
    if (phones.length > 0) {
      const phoneQueries = phones.map(p => 
        client.query(
          `INSERT INTO contact_phones (contact_id, phone, label) VALUES ($1, $2, $3)`,
          [contactId, p.phone, p.label]
        )
      );
      await Promise.all(phoneQueries);
    }

    // 📍 Insert Addresses
    if (addresses.length > 0) {
      const addrQueries = addresses.map(a => 
        client.query(
          `INSERT INTO contact_addresses (contact_id, address_line, city, state, pincode, label)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [contactId, a.address_line, a.city, a.state, a.pincode, a.label]
        )
      );
      await Promise.all(addrQueries);
    }

    await client.query('COMMIT');

    res.status(201).json({
      status: 'success',
      message: 'Wholesaler added successfully',
      contactId,
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Wholesaler Error:", error);
    
    res.status(500).json({
      message: error.code === '23505' ? 'Duplicate entry detected' : 'Server Error',
    });
  } finally {
    client.release();
  }
});

const addContactPhones = asyncHandler(async (req, res) => {
  const client = await pool.connect();

  try {
    const contactId = req.params.id;
    const { phone, label, phones } = req.body;

    await client.query('BEGIN');

    // 🔍 Check contact exists
    const contactCheck = await client.query(
      'SELECT id FROM contacts WHERE id = $1',
      [contactId]
    );

    if (contactCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Contact not found' });
    }

    // 🔹 Handle single phone
    if (phone) {
      const exists = await isPhoneDuplicate(client, contactId, phone);

      if (exists) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: `Phone ${phone} already exists for this contact`,
        });
      }

      await client.query(
        `INSERT INTO contact_phones (contact_id, phone, label)
         VALUES ($1, $2, $3)`,
        [contactId, phone, label || 'primary']
      );
    }

    // 🔹 Handle multiple phones
    if (phones && Array.isArray(phones)) {
      for (const p of phones) {
        const exists = await isPhoneDuplicate(client, contactId, p.phone);

        if (exists) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            message: `Phone ${p.phone} already exists`,
          });
        }

        await client.query(
          `INSERT INTO contact_phones (contact_id, phone, label)
           VALUES ($1, $2, $3)`,
          [contactId, p.phone, p.label || 'secondary']
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      status: 'success',
      message: 'Phone(s) added successfully',
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);

    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

/**
 * @function updatePhone
 * @description Update an existing phone number for a contact
 * 
 * @route PUT /api/phones/:phoneId
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {number} req.params.phoneId - ID of the phone record to update
 * 
 * @param {Object} req.body - Request body
 * @param {string} req.body.phone - New phone number (required)
 * @param {string} [req.body.label] - Phone label (optional, e.g., primary, secondary)
 * 
 * @param {Object} res - Express response object
 * 
 * @throws {400} If phone is missing or duplicate exists
 * @throws {404} If phone record is not found
 * @throws {500} If server/database error occurs
 * 
 * @returns {JSON} Success response with updated phone data
 */
const updatePhone = asyncHandler(async (req, res) => {
  const client = await pool.connect();

  const phoneId = req.params.phoneId;
  const { phone, label } = req.body;

  // 🔹 Validate input
  if (!phone) {
    const error = new Error("Phone is required");
    error.statusCode = 400;
    throw error;
  }

  try {
    await client.query('BEGIN');

    // 🔍 Check if phone exists
    const existing = await client.query(
      `SELECT contact_id FROM contact_phones WHERE id = $1`,
      [phoneId]
    );

    if (existing.rows.length === 0) {
      const error = new Error("Phone not found");
      error.statusCode = 404;
      throw error;
    }

    const contactId = existing.rows[0].contact_id;

    // 🔍 Check duplicate phone for same contact
    const duplicate = await client.query(
      `SELECT id FROM contact_phones 
       WHERE contact_id = $1 AND phone = $2 AND id != $3`,
      [contactId, phone, phoneId]
    );

    if (duplicate.rows.length > 0) {
      const error = new Error("Phone number already exists for this contact");
      error.statusCode = 400;
      throw error;
    }

    // ✅ Update phone
    const result = await client.query(
      `UPDATE contact_phones 
       SET phone = $1, label = $2 
       WHERE id = $3
       RETURNING *`,
      [phone, label || 'primary', phoneId]
    );

    await client.query('COMMIT');

    // 📤 Send response
    res.status(200).json({
      status: "success",
      data: result.rows[0],
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

/**
 * @desc Get wholesaler details from view
 * @route GET /api/wholesalers/:id
 */
const getWholesalerDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Basic validation
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid wholesaler ID",
      });
    }

    const query = `
      SELECT * 
      FROM wholesaler_details_view
      WHERE id = $1
    `;

    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Wholesaler not found",
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0],
    });

  } catch (error) {
    next(error); // Global error handler
  }
};


/**
 * @desc Update wholesaler basic info
 * @route PUT /api/wholesalers/:id
 */
const updateWholesalerBasicInfo = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { name, gst_no, email, contact_type } = req.body;

    // 🔎 Validate ID
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid wholesaler ID",
      });
    }

    // 🔎 Required fields
    if (!name || !contact_type) {
      return res.status(400).json({
        success: false,
        message: "Name and contact_type are required",
      });
    }

    // 🔎 Check existence
    const existing = await client.query(
      `SELECT id FROM contacts WHERE id = $1 AND contact_type = 'wholesaler'`,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Wholesaler not found",
      });
    }

    // 🔥 Duplicate checks (NOW CORRECT)
    const gstError = await checkDuplicateGst(client, gst_no, contact_type, id);
    if (gstError) {
      return res.status(400).json({
        success: false,
        message: gstError,
      });
    }

    const emailError = await checkDuplicateEmail(client, email, contact_type, id);
    if (emailError) {
      return res.status(400).json({
        success: false,
        message: emailError,
      });
    }

    // 📝 Update
    const updateQuery = `
      UPDATE contacts
      SET 
        name = $1,
        gst_no = $2,
        email = $3,
        contact_type = $4
      WHERE id = $5
      RETURNING *;
    `;

    const { rows } = await client.query(updateQuery, [
      name,
      gst_no || null,
      email || null,
      contact_type,
      id
    ]);

    res.status(200).json({
      success: true,
      message: "Wholesaler updated successfully",
      data: rows[0],
    });

  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
};


/**
 * @desc Update wholesaler address
 * @route PUT /api/wholesalers/:id/address/:addressId
 * @access Private (recommended)
 */
const updateWholesalerAddress = async (req, res, next) => {
  const client = await pool.connect();

  try {
    console.log("Update Address Params:", req.params);
    console.log("Update Address Body:", req.body);
    const { id, addressId } = req.params;
    const { address_line, city, state, pincode, label } = req.body;
    

    // 🔎 Validate IDs
    if (isNaN(id) || isNaN(addressId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID(s)",
      });
    }

    // 🔎 Check wholesaler exists
    const wholesalerCheck = await client.query(
      `SELECT id FROM contacts WHERE id = $1 AND contact_type = 'wholesaler'`,
      [id]
    );

    if (wholesalerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Wholesaler not found",
      });
    }

    // 🔎 Check address belongs to wholesaler
    const addressCheck = await client.query(
      `SELECT id FROM contact_addresses 
       WHERE id = $1 AND contact_id = $2`,
      [addressId, id]
    );

    if (addressCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Address not found for this wholesaler",
      });
    }

    // 📝 Update address
    const updateQuery = `
      UPDATE contact_addresses
      SET 
        address_line = $1,
        city = $2,
        state = $3,
        pincode = $4,
        label = $5
      WHERE id = $6
      RETURNING *;
    `;

    const { rows } = await client.query(updateQuery, [
      address_line || null,
      city || null,
      state || null,
      pincode || null,
      label || null,
      addressId
    ]);

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: rows[0],
    });

  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
};



module.exports = {
  searchWholesalers,
  addWholesaler,
  addContactPhones,
  updatePhone,
  getWholesalerDetails,
  updateWholesalerBasicInfo,
  updateWholesalerAddress,
  getWholesalerSuggestions

};  