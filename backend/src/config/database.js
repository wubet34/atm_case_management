const { Pool } = require("pg");

// Your exact Neon connection string
const connectionString = "postgresql://neondb_owner:npg_sCzpElnA85QY@ep-small-firefly-aqvrfbo6-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false, // Required for Neon
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Neon PostgreSQL connected successfully");
    console.log("Database:", client.database);
    client.release();
    return true;
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
    return false;
  }
};

// Query helper
const query = (text, params) => pool.query(text, params);

module.exports = {
  query,
  pool,
  testConnection,
};