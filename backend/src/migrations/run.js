const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

// Read the init.sql file
const initSqlPath = path.join(__dirname, 'init.sql');
const initSql = fs.readFileSync(initSqlPath, 'utf8');

async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  console.log('📁 Using migration file:', initSqlPath);
  
  try {
    // Split SQL statements by semicolon, but be careful with function bodies
    const statements = initSql.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;
      
      try {
        await pool.query(statement);
        successCount++;
        process.stdout.write(`\r✓ Executed ${successCount}/${statements.length} statements`);
      } catch (error) {
        errorCount++;
        console.log(`\n✗ Error in statement ${i + 1}:`, error.message);
        console.log(`Statement: ${statement.substring(0, 100)}...`);
        
        // Don't exit on error for CREATE IF NOT EXISTS statements
        if (!statement.toLowerCase().includes('create table if not exists')) {
          throw error;
        }
      }
    }
    
    console.log(`\n✅ Migration completed!`);
    console.log(`   Success: ${successCount} statements`);
    console.log(`   Errors: ${errorCount} statements (ignored)`);
    
    // Verify tables were created
    const verifyResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'cases', 'notifications', 'activity_logs', 'technician_reports')
    `);
    
    console.log('\n📊 Created tables:');
    verifyResult.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations();