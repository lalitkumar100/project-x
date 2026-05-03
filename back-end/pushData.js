const fs = require('fs');
const path = require('path');
const pool = require('./config/db');

const pushData = async () => {
  try {
    // Use file from argument or default to sqlQuery.txt
    const fileName = process.argv[2] || 'sqlQuery.txt';
    const sqlPath = path.join(__dirname, '..', 'data', fileName);
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`File not found: ${sqlPath}`);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL query...');
    
    // Execute the query
    const res = await pool.query(sql);
    
    console.log('Data pushed successfully!');
    console.log('Response:', res);

  } catch (err) {
    console.error('Error executing query:', err.message);
    if (err.detail) console.error('Detail:', err.detail);
  } finally {
    // Close the pool connection
    await pool.end();
    process.exit();
  }
};

pushData();
