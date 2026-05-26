const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function addTechnicianReports() {
  console.log('📝 Adding technician_reports table...');
  
  const sqlPath = path.join(__dirname, 'add_technician_reports.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  try {
    await pool.query(sql);
    console.log('✅ technician_reports table created successfully');
    
    // Verify
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'technician_reports'
      );
    `);
    
    if (result.rows[0].exists) {
      console.log('✓ Verification: technician_reports table exists');
    }
    
  } catch (error) {
    console.error('❌ Error creating technician_reports:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addTechnicianReports();