/**
 * Check database schema
 */

import { config } from "dotenv";
import { resolve } from "path";
import { Pool } from "pg";

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkSchema() {
  const client = await pool.connect();

  try {
    console.log("Checking database schema...\n");

    // Get all tables
    const tablesResult = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log("Tables:", tablesResult.rows.map(r => r.tablename).join(", "));
    console.log();

    // Check each Better Auth table
    for (const tableName of ['user', 'session', 'account', 'verification']) {
      console.log(`\n=== ${tableName} table ===`);

      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);

      if (columnsResult.rows.length === 0) {
        console.log(`❌ Table "${tableName}" does not exist!`);
      } else {
        columnsResult.rows.forEach(col => {
          console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
      }
    }

    console.log("\n✅ Schema check complete");

  } catch (error) {
    console.error("❌ Schema check failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema().catch(console.error);
