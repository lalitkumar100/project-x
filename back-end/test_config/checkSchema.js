const fs = require('fs/promises');

const dotenv = require('dotenv');
;
const path = require('path');
const { Pool } = require('pg');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const outputPath = path.resolve(__dirname, 'actualSchema');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASSWORD || ''),
  port: Number(process.env.DB_PORT || 5432),
});

async function query(client, text) {
  const result = await client.query(text);
  return result.rows;
}

async function getDatabaseInfo(client) {
  const [info] = await query(
    client,
    `
      SELECT
        current_database() AS database_name,
        current_user AS user_name,
        inet_server_addr() AS host,
        inet_server_port() AS port,
        version() AS postgres_version,
        now() AS extracted_at
    `
  );

  return info;
}

async function getSchemaSnapshot(client) {
  const schemas = await query(
    client,
    `
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog')
        AND schema_name NOT LIKE 'pg_toast%'
      ORDER BY schema_name
    `
  );

  const relations = await query(
    client,
    `
      SELECT
        n.nspname AS schema_name,
        c.relname AS relation_name,
        CASE c.relkind
          WHEN 'r' THEN 'table'
          WHEN 'p' THEN 'partitioned_table'
          WHEN 'v' THEN 'view'
          WHEN 'm' THEN 'materialized_view'
          WHEN 'f' THEN 'foreign_table'
          ELSE c.relkind::text
        END AS relation_type,
        obj_description(c.oid, 'pg_class') AS comment
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname NOT IN ('information_schema', 'pg_catalog')
        AND n.nspname NOT LIKE 'pg_toast%'
        AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
      ORDER BY n.nspname, c.relkind, c.relname
    `
  );

  const columns = await query(
    client,
    `
      SELECT
        table_schema AS schema_name,
        table_name AS relation_name,
        column_name,
        ordinal_position,
        data_type,
        udt_name,
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        datetime_precision,
        is_nullable,
        column_default,
        is_identity,
        identity_generation,
        is_generated,
        generation_expression
      FROM information_schema.columns
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
        AND table_schema NOT LIKE 'pg_toast%'
      ORDER BY table_schema, table_name, ordinal_position
    `
  );

  const constraints = await query(
    client,
    `
      SELECT
        n.nspname AS schema_name,
        rel.relname AS table_name,
        con.conname AS constraint_name,
        CASE con.contype
          WHEN 'p' THEN 'primary_key'
          WHEN 'f' THEN 'foreign_key'
          WHEN 'u' THEN 'unique'
          WHEN 'c' THEN 'check'
          WHEN 'x' THEN 'exclusion'
          ELSE con.contype::text
        END AS constraint_type,
        pg_get_constraintdef(con.oid, true) AS definition,
        refn.nspname AS referenced_schema,
        refrel.relname AS referenced_table
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace n ON n.oid = rel.relnamespace
      LEFT JOIN pg_class refrel ON refrel.oid = con.confrelid
      LEFT JOIN pg_namespace refn ON refn.oid = refrel.relnamespace
      WHERE n.nspname NOT IN ('information_schema', 'pg_catalog')
        AND n.nspname NOT LIKE 'pg_toast%'
      ORDER BY n.nspname, rel.relname, con.conname
    `
  );

  const indexes = await query(
    client,
    `
      SELECT
        schemaname AS schema_name,
        tablename AS table_name,
        indexname AS index_name,
        indexdef AS definition
      FROM pg_indexes
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
        AND schemaname NOT LIKE 'pg_toast%'
      ORDER BY schemaname, tablename, indexname
    `
  );

  const triggers = await query(
    client,
    `
      SELECT
        event_object_schema AS schema_name,
        event_object_table AS table_name,
        trigger_name,
        action_timing,
        event_manipulation,
        action_orientation,
        action_statement
      FROM information_schema.triggers
      WHERE trigger_schema NOT IN ('information_schema', 'pg_catalog')
      ORDER BY event_object_schema, event_object_table, trigger_name, event_manipulation
    `
  );

  const sequences = await query(
    client,
    `
      SELECT
        sequence_schema AS schema_name,
        sequence_name,
        data_type,
        start_value,
        minimum_value,
        maximum_value,
        increment,
        cycle_option
      FROM information_schema.sequences
      WHERE sequence_schema NOT IN ('information_schema', 'pg_catalog')
        AND sequence_schema NOT LIKE 'pg_toast%'
      ORDER BY sequence_schema, sequence_name
    `
  );

  const views = await query(
    client,
    `
      SELECT
        schemaname AS schema_name,
        viewname AS view_name,
        definition
      FROM pg_views
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
        AND schemaname NOT LIKE 'pg_toast%'
      ORDER BY schemaname, viewname
    `
  );

  const materializedViews = await query(
    client,
    `
      SELECT
        schemaname AS schema_name,
        matviewname AS view_name,
        definition
      FROM pg_matviews
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
        AND schemaname NOT LIKE 'pg_toast%'
      ORDER BY schemaname, matviewname
    `
  );

  const routines = await query(
    client,
    `
      SELECT
        routine_schema AS schema_name,
        routine_name,
        routine_type,
        data_type AS return_type,
        type_udt_name AS return_udt_name
      FROM information_schema.routines
      WHERE routine_schema NOT IN ('information_schema', 'pg_catalog')
        AND routine_schema NOT LIKE 'pg_toast%'
      ORDER BY routine_schema, routine_name, routine_type
    `
  );

  const enums = await query(
    client,
    `
      SELECT
        n.nspname AS schema_name,
        t.typname AS enum_name,
        array_agg(e.enumlabel ORDER BY e.enumsortorder) AS values
      FROM pg_type t
      JOIN pg_enum e ON e.enumtypid = t.oid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname NOT IN ('information_schema', 'pg_catalog')
        AND n.nspname NOT LIKE 'pg_toast%'
      GROUP BY n.nspname, t.typname
      ORDER BY n.nspname, t.typname
    `
  );

  return {
    database: await getDatabaseInfo(client),
    schemas: schemas.map((schema) => schema.schema_name),
    relations,
    columns,
    constraints,
    indexes,
    triggers,
    sequences,
    views,
    materializedViews,
    routines,
    enums,
  };
}

function formatColumnType(column) {
  if (column.character_maximum_length) {
    return `${column.data_type}(${column.character_maximum_length})`;
  }

  if (column.numeric_precision && column.numeric_scale !== null) {
    return `${column.data_type}(${column.numeric_precision}, ${column.numeric_scale})`;
  }

  if (column.numeric_precision) {
    return `${column.data_type}(${column.numeric_precision})`;
  }

  if (column.data_type === 'USER-DEFINED') {
    return column.udt_name;
  }

  return column.data_type;
}

function formatSchemaSnapshot(snapshot) {
  const lines = [
    '-- Database schema snapshot',
    '-- This file is generated by back-end/test_config/checkSchema.js.',
    '-- It is meant for humans to read. Use actualSchema.json if you need raw JSON.',
    '--',
    `-- Database: ${snapshot.database.database_name}`,
    `-- Connected user: ${snapshot.database.user_name}`,
    `-- Host: ${snapshot.database.host || 'local'}:${snapshot.database.port || ''}`,
    `-- Extracted at: ${snapshot.database.extracted_at}`,
    '',
    '-- How to read this file:',
    '-- TABLE sections show each table and its columns.',
    '-- PK means primary key, FK means foreign key, UQ means unique constraint.',
    '-- NULL means the column can be empty. NOT NULL means it must have a value.',
    '-- DEFAULT shows the value PostgreSQL uses when no value is provided.',
    '-- INDEX sections show indexes that help speed up lookup and enforce uniqueness.',
    '-- VIEW sections show saved SQL queries exposed like tables.',
    '',
  ];

  const constraintsByTable = new Map();
  for (const constraint of snapshot.constraints) {
    const key = `${constraint.schema_name}.${constraint.table_name}`;
    const constraints = constraintsByTable.get(key) || [];
    constraints.push(constraint);
    constraintsByTable.set(key, constraints);
  }

  const indexesByTable = new Map();
  for (const index of snapshot.indexes) {
    const key = `${index.schema_name}.${index.table_name}`;
    const indexes = indexesByTable.get(key) || [];
    indexes.push(index);
    indexesByTable.set(key, indexes);
  }

  const triggersByTable = new Map();
  for (const trigger of snapshot.triggers) {
    const key = `${trigger.schema_name}.${trigger.table_name}`;
    const triggers = triggersByTable.get(key) || [];
    triggers.push(trigger);
    triggersByTable.set(key, triggers);
  }

  const tableRelations = snapshot.relations.filter((relation) =>
    ['table', 'partitioned_table', 'foreign_table'].includes(relation.relation_type)
  );

  lines.push('-- SCHEMAS');
  for (const schema of snapshot.schemas) {
    lines.push(`-- - ${schema}`);
  }
  lines.push('');

  lines.push('-- TABLES');
  for (const relation of tableRelations) {
    const fullName = `${relation.schema_name}.${relation.relation_name}`;
    const tableColumns = snapshot.columns.filter(
      (column) =>
        column.schema_name === relation.schema_name &&
        column.relation_name === relation.relation_name
    );

    lines.push('');
    lines.push(`-- TABLE: ${fullName}`);
    lines.push(`-- Type: ${relation.relation_type}`);
    if (relation.comment) {
      lines.push(`-- Comment: ${relation.comment}`);
    }
    lines.push('-- Columns:');

    for (const column of tableColumns) {
      const parts = [
        `--   ${column.ordinal_position}. ${column.column_name}`,
        formatColumnType(column),
        column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL',
      ];

      if (column.column_default) {
        parts.push(`DEFAULT ${column.column_default}`);
      }

      if (column.is_identity === 'YES') {
        parts.push(`IDENTITY ${column.identity_generation}`);
      }

      if (column.is_generated !== 'NEVER') {
        parts.push(`GENERATED ${column.generation_expression || ''}`.trim());
      }

      lines.push(parts.join(' | '));
    }

    const tableConstraints = constraintsByTable.get(fullName) || [];
    if (tableConstraints.length) {
      lines.push('-- Constraints:');
      for (const constraint of tableConstraints) {
        lines.push(
          `--   ${constraint.constraint_type.toUpperCase()}: ${constraint.constraint_name} -> ${constraint.definition}`
        );
      }
    }

    const tableIndexes = indexesByTable.get(fullName) || [];
    if (tableIndexes.length) {
      lines.push('-- Indexes:');
      for (const index of tableIndexes) {
        lines.push(`--   ${index.index_name} -> ${index.definition}`);
      }
    }

    const tableTriggers = triggersByTable.get(fullName) || [];
    if (tableTriggers.length) {
      lines.push('-- Triggers:');
      for (const trigger of tableTriggers) {
        lines.push(
          `--   ${trigger.trigger_name} -> ${trigger.action_timing} ${trigger.event_manipulation} ${trigger.action_statement}`
        );
      }
    }
  }

  if (snapshot.views.length) {
    lines.push('');
    lines.push('-- VIEWS');
    for (const view of snapshot.views) {
      lines.push('');
      lines.push(`-- VIEW: ${view.schema_name}.${view.view_name}`);
      lines.push(view.definition.trim());
    }
  }

  if (snapshot.materializedViews.length) {
    lines.push('');
    lines.push('-- MATERIALIZED VIEWS');
    for (const view of snapshot.materializedViews) {
      lines.push('');
      lines.push(`-- MATERIALIZED VIEW: ${view.schema_name}.${view.view_name}`);
      lines.push(view.definition.trim());
    }
  }

  if (snapshot.sequences.length) {
    lines.push('');
    lines.push('-- SEQUENCES');
    for (const sequence of snapshot.sequences) {
      lines.push(
        `-- ${sequence.schema_name}.${sequence.sequence_name} | ${sequence.data_type} | start ${sequence.start_value} | increment ${sequence.increment}`
      );
    }
  }

  if (snapshot.enums.length) {
    lines.push('');
    lines.push('-- ENUM TYPES');
    for (const enumType of snapshot.enums) {
      lines.push(`-- ${enumType.schema_name}.${enumType.enum_name}: ${enumType.values.join(', ')}`);
    }
  }

  if (snapshot.routines.length) {
    lines.push('');
    lines.push('-- FUNCTIONS AND PROCEDURES');
    for (const routine of snapshot.routines) {
      lines.push(
        `-- ${routine.schema_name}.${routine.routine_name} | ${routine.routine_type} | returns ${routine.return_type || routine.return_udt_name}`
      );
    }
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}

async function main() {
  const client = await pool.connect();

  try {
    const snapshot = await getSchemaSnapshot(client);
    await fs.writeFile(outputPath, formatSchemaSnapshot(snapshot));
    console.log(`Schema written to ${outputPath}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(async (error) => {
  console.error('Failed to extract database schema:', error);
  await pool.end().catch(() => {});
  process.exitCode = 1;
});
