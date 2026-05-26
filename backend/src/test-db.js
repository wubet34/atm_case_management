const { pool, testConnection } = require('./config/database');

async function test() {
  console.log("Testing database connection...");
  
  const connected = await testConnection();
  
  if (connected) {
    try {
      const result = await pool.query("SELECT NOW() as current_time, version() as pg_version");
      console.log("✅ Query successful!");
      console.log("Current time:", result.rows[0].current_time);
      console.log("PostgreSQL version:", result.rows[0].pg_version);
      
      // Test tables
      const tables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      console.log("\n📊 Existing tables:");
      tables.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
      
    } catch (error) {
      console.error("❌ Query failed:", error.message);
    }
  }
  
  await pool.end();
}

test();