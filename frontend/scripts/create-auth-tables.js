const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const createTables = async () => {
  const client = await pool.connect();

  try {
    console.log('🔄 Creating Better Auth tables...\n');

    // User table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        "emailVerified" BOOLEAN DEFAULT FALSE NOT NULL,
        name TEXT NOT NULL,
        image TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    console.log('✅ Created table: user');

    // Account table
    await client.query(`
      CREATE TABLE IF NOT EXISTS account (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "accountId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        password TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        UNIQUE("userId", "providerId")
      );
    `);
    console.log('✅ Created table: account');

    // Session table
    await client.query(`
      CREATE TABLE IF NOT EXISTS session (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "expiresAt" TIMESTAMP NOT NULL,
        token TEXT NOT NULL UNIQUE,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    console.log('✅ Created table: session');

    // Verification table
    await client.query(`
      CREATE TABLE IF NOT EXISTS verification (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    console.log('✅ Created table: verification');

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_account_userId ON account("userId");
      CREATE INDEX IF NOT EXISTS idx_session_userId ON session("userId");
      CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
      CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
    `);
    console.log('✅ Created indexes\n');

    console.log('🎉 Better Auth tables created successfully!\n');
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

createTables();
