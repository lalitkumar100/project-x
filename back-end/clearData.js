const pool = require('./config/db');

const clearData = async () => {
  try {
    console.log('Clearing data from all tables...');
    
    // Disable triggers to avoid foreign key constraints during truncation if necessary, 
    // or just truncate in the correct order or with CASCADE.
    // CASCADE is easier for cleaning everything.
    await pool.query('TRUNCATE items, brands, categories, subcategories, contacts, contact_phones, contact_addresses, purchases, purchase_items, employees, customers, customer_phones, customer_addresses, sales, sales_items, replacement_items RESTART IDENTITY CASCADE;');

    console.log('All data cleared successfully!');

  } catch (err) {
    console.error('Error clearing data:', err.message);
  } finally {
    await pool.end();
    process.exit();
  }
};

clearData();
