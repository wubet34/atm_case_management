const fs = require('fs');
const path = require('path');
const { pool, testConnection } = require('../config/database');

async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  
  // Test connection first
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('❌ Cannot connect to database. Please check your configuration.');
    process.exit(1);
  }
  
  const initSqlPath = path.join(__dirname, 'init.sql');
  
  if (!fs.existsSync(initSqlPath)) {
    console.error('❌ Migration file not found:', initSqlPath);
    process.exit(1);
  }
  
  const initSql = fs.readFileSync(initSqlPath, 'utf8');
  console.log('📁 Using migration file:', initSqlPath);
  
  // Split SQL statements more carefully
  const statements = initSql.split(';').filter(stmt => {
    const trimmed = stmt.trim();
    return trimmed.length > 0 && !trimmed.startsWith('--');
  });
  
  console.log(`📝 Found ${statements.length} SQL statements to execute`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (!statement) continue;
    
    try {
      await pool.query('BEGIN');
      await pool.query(statement);
      await pool.query('COMMIT');
      successCount++;
      process.stdout.write(`\r✓ Executed ${successCount}/${statements.length} statements`);
    } catch (error) {
      await pool.query('ROLLBACK');
      errorCount++;
      console.log(`\n✗ Error in statement ${i + 1}:`, error.message);
      
      // Don't exit on error for CREATE IF NOT EXISTS statements
      if (!statement.toLowerCase().includes('create table if not exists') &&
          !statement.toLowerCase().includes('create index if not exists')) {
        console.log('Fatal error. Stopping migration.');
        process.exit(1);
      }
    }
  }
  
  console.log(`\n✅ Migration completed!`);
  console.log(`   Success: ${successCount} statements`);
  console.log(`   Errors: ${errorCount} statements (ignored)`);
  
  await pool.end();
}

runMigrations().catch(console.error);