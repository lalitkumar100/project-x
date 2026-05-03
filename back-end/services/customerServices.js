const pool = require('../config/db');

const findCustomerByPhone = async (phone) => {
  const { rows } = await pool.query(
    `
      SELECT
        c.id,
        c.name,
        c.email,
        c.tcg_id,
        cp.phone,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', ca.id,
              'address_line', ca.address_line,
              'city', ca.city,
              'state', ca.state,
              'pincode', ca.pincode,
              'label', ca.label
            )
          ) FILTER (WHERE ca.id IS NOT NULL),
          '[]'::json
        ) AS addresses
      FROM customers c
      INNER JOIN customer_phones cp ON cp.customer_id = c.id
      LEFT JOIN customer_addresses ca ON ca.customer_id = c.id
      WHERE cp.phone = $1
      GROUP BY c.id, cp.phone
      LIMIT 1
    `,
    [phone]
  );

  return rows[0] || null;
};

module.exports = {
  findCustomerByPhone
};
