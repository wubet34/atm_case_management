const db = require('../config/database');

async function migrateLocalStorageReports() {
    // This is a one-time migration script
    // You would need to collect reports from all technicians
    // Since localStorage is client-side, you may need to ask each technician to run this
    
    console.log('Migration script for localStorage reports to PostgreSQL');
    console.log('Note: This migration requires each technician to submit their localStorage data');
    console.log('');
    console.log('To migrate a specific user\'s reports, they should run a script in browser console:');
    console.log(`
        // Run this in browser console
        const reports = localStorage.getItem('technicianReports');
        if (reports) {
            fetch('/api/technician-reports/migrate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                body: JSON.stringify({ reports: JSON.parse(reports) })
            }).then(res => res.json()).then(console.log);
        }
    `);
}

// Optional: Create migration endpoint
async function createMigrationEndpoint(app) {
    app.post('/api/technician-reports/migrate', async (req, res) => {
        try {
            const { reports } = req.body;
            const userId = req.user.id;
            const userName = req.user.name;
            
            if (!Array.isArray(reports)) {
                return res.status(400).json({ error: 'Invalid reports data' });
            }
            
            const migrated = [];
            for (const report of reports) {
                // Check if report already exists
                const existing = await db.query(
                    'SELECT id FROM technician_reports WHERE title = $1 AND technician_id = $2 AND created_at = $3',
                    [report.title, userId, new Date(report.createdAt)]
                );
                
                if (existing.rows.length === 0) {
                    const result = await db.query(`
                        INSERT INTO technician_reports 
                        (title, description, report_date, technician_id, technician_name, status, created_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        RETURNING id
                    `, [
                        report.title,
                        report.description,
                        report.date,
                        userId,
                        userName,
                        report.status || 'pending',
                        new Date(report.createdAt)
                    ]);
                    migrated.push(result.rows[0].id);
                }
            }
            
            res.json({ success: true, migrated: migrated.length, message: `Migrated ${migrated.length} reports` });
        } catch (error) {
            console.error('Migration error:', error);
            res.status(500).json({ error: error.message });
        }
    });
}

module.exports = { migrateLocalStorageReports, createMigrationEndpoint };