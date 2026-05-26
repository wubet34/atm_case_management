const { pool } = require('../config/database');

async function checkMigrationStatus() {
  console.log('📊 Database Migration Status\n');
  
  const tables = ['users', 'cases', 'notifications', 'activity_logs', 'technician_reports'];
  
  for (const table of tables) {
    try {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `, [table]);
      
      const exists = result.rows[0].exists;
      console.log(`${exists ? '✓' : '✗'} ${table} - ${exists ? 'Created' : 'Missing'}`);
      
      if (exists) {
        const count = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`  └─ ${count.rows[0].count} records`);
      }
    } catch (error) {
      console.log(`✗ ${table} - Error: ${error.message}`);
    }
  }
  
  await pool.end();
}

checkMigrationStatus();