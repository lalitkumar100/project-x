const pool = require('../config/db');



/**
 * Check if GST already exists for a specific contact type
 * @param {import('pg').PoolClient} client
 * @param {string} gst_no
 * @param {string} contact_type
 * @returns {Promise<string|null>} Returns error message or null
 */
const checkDuplicateGst = async (client, gst_no, contact_type, excludeId) => {
  if (!gst_no) return null;

  const result = await client.query(
    `SELECT id 
     FROM contacts 
     WHERE gst_no = $1 
       AND contact_type = $2
       AND id != $3`,
    [gst_no, contact_type, excludeId]
  );

  return result.rows.length > 0 ? "GST number already exists" : null;
};


/**
 * Check if Email already exists for a specific contact type
 * @param {import('pg').PoolClient} client
 * @param {string} email
 * @param {string} contact_type
 * @returns {Promise<string|null>} Returns error message or null
 */
const checkDuplicateEmail = async (client, email, contact_type, excludeId) => {
  if (!email) return null;

  const result = await client.query(
    `SELECT id 
     FROM contacts 
     WHERE email = $1 
       AND contact_type = $2
       AND id != $3`,
    [email, contact_type, excludeId]
  );

  return result.rows.length > 0 ? "Email already exists" : null;
};


/**
 * Check if phone already exists for a contact
 * @param {import('pg').PoolClient} client
 * @param {number} contactId
 * @param {string} phone
 * @returns {Promise<boolean>}
 */
const isPhoneDuplicate = async (client, contactId, phone) => {
  const result = await client.query(
    `SELECT id FROM contact_phones WHERE contact_id = $1 AND phone = $2`,
    [contactId, phone]
  );

  return result.rows.length > 0;
};

module.exports = {
  checkDuplicateGst,
  checkDuplicateEmail,
  isPhoneDuplicate,
};  