/**
 * db_manager.js
 * 
 * Database setup and teardown manager.
 * 
 * Commands:
 *   node db_manager.js --clear-data       -> Delete only data (TRUNCATE)
 *   node db_manager.js --drop-schema      -> Delete schema plus data
 *   node db_manager.js --add-schema       -> Add the schema to the database
 *   node db_manager.js --reset-all        -> Drop everything and recreate schema
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { Pool } = require("pg");

const pool = new Pool({
  host:     process.env.DB_HOST     || "localhost",
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

/* ── New schema SQL (derived from actualSchema) ────────────────── */
const fs = require('fs');
const path = require('path');
const NEW_SCHEMA_SQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');

// Function 1: Delete only full data (TRUNCATE)
async function clearDataOnly() {
  const client = await pool.connect();
  try {
    console.log("🗑️  Truncating all data in tables...");
    const { rows } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    
    if(rows.length > 0) {
        const tables = rows.map(r => '"' + r.table_name + '"').join(", ");
        await client.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
        console.log("✅ Successfully truncated " + rows.length + " tables.");
    } else {
        console.log("⚠️  No tables found to truncate.");
    }
  } finally {
    client.release();
  }
}

// Function 2: Delete schema plus data
async function dropSchemaAndData() {
  const client = await pool.connect();
  try {
    console.log("🧨 Dropping public schema and all data...");
    await client.query("DROP SCHEMA public CASCADE");
    await client.query("CREATE SCHEMA public");
    await client.query("GRANT ALL ON SCHEMA public TO postgres");
    await client.query("GRANT ALL ON SCHEMA public TO public");
    console.log("✅ Public schema dropped and recreated empty.");
  } finally {
    client.release();
  }
}

// Function 3: Add schema to database
async function addSchema() {
  const client = await pool.connect();
  try {
    console.log("🏗️  Adding schema to database...");
    await client.query(NEW_SCHEMA_SQL);
    console.log("✅ Schema created successfully.");

    console.log("🌱 Seeding default Unregistered customer...");
    await client.query(`
      INSERT INTO customers (id, name)
      VALUES (1, 'Unregistered')
      ON CONFLICT (id) DO NOTHING
    `);
    await client.query(`SELECT setval('customers_id_seq', COALESCE((SELECT MAX(id) FROM customers), 1), true)`);
    console.log("✅ Default seed complete.");
  } finally {
    client.release();
  }
}

// Command runner
async function run() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage: node db_manager.js [command]

Commands:
  --clear-data       Delete only data from database (TRUNCATE)
  --drop-schema      Delete schema plus data (DROP SCHEMA)
  --add-schema       Add the schema to the database (CREATE TABLES/VIEWS)
  --reset-all        Drop schema, and then add schema (Full Reset)
`);
    process.exit(0);
  }

  try {
    if (args.includes('--clear-data')) {
      await clearDataOnly();
    }
    
    if (args.includes('--drop-schema') || args.includes('--reset-all')) {
      await dropSchemaAndData();
    }

    if (args.includes('--add-schema') || args.includes('--reset-all')) {
      await addSchema();
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await pool.end();
  }
}

// Export for programmatic use or run directly
if (require.main === module) {
  run();
}

module.exports = {
  clearDataOnly,
  dropSchemaAndData,
  addSchema
};
