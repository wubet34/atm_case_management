const { pool } = require('../config/database');

class TechnicianReport {
    // Create a new report
    static async create(reportData) {
        const { title, description, report_date, technician_id, technician_name } = reportData;
        const query = `
            INSERT INTO technician_reports (title, description, report_date, technician_id, technician_name)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [title, description, report_date, technician_id, technician_name];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    // Get all reports (admin)
    static async getAll(filters = {}) {
        let query = `
            SELECT 
                tr.*,
                u.email as technician_email,
                u.phone as technician_phone,
                u.district as technician_district,
                ru.name as reviewer_name
            FROM technician_reports tr
            LEFT JOIN users u ON tr.technician_id = u.id
            LEFT JOIN users ru ON tr.reviewed_by = ru.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (filters.status && filters.status !== 'all') {
            query += ` AND tr.status = $${paramIndex++}`;
            params.push(filters.status);
        }

        if (filters.technician_id) {
            query += ` AND tr.technician_id = $${paramIndex++}`;
            params.push(filters.technician_id);
        }

        if (filters.startDate) {
            query += ` AND tr.report_date >= $${paramIndex++}`;
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            query += ` AND tr.report_date <= $${paramIndex++}`;
            params.push(filters.endDate);
        }

        query += ` ORDER BY tr.created_at DESC`;

        const result = await pool.query(query, params);
        return result.rows;
    }

    // Get reports by technician ID
    static async getByTechnicianId(technicianId, filters = {}) {
        let query = `
            SELECT * FROM technician_reports
            WHERE technician_id = $1
        `;
        const params = [technicianId];
        let paramIndex = 2;

        if (filters.status && filters.status !== 'all') {
            query += ` AND status = $${paramIndex++}`;
            params.push(filters.status);
        }

        if (filters.startDate) {
            query += ` AND report_date >= $${paramIndex++}`;
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            query += ` AND report_date <= $${paramIndex++}`;
            params.push(filters.endDate);
        }

        query += ` ORDER BY created_at DESC`;

        const result = await pool.query(query, params);
        return result.rows;
    }

    // Get single report by ID
    static async getById(id) {
        const query = `
            SELECT 
                tr.*,
                u.email as technician_email,
                u.phone as technician_phone,
                ru.name as reviewer_name
            FROM technician_reports tr
            LEFT JOIN users u ON tr.technician_id = u.id
            LEFT JOIN users ru ON tr.reviewed_by = ru.id
            WHERE tr.id = $1
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    // Update report status (review)
    static async updateStatus(id, status, reviewedBy = null) {
        let query = `
            UPDATE technician_reports 
            SET status = $1, updated_at = CURRENT_TIMESTAMP
        `;
        const params = [status];
        
        if (reviewedBy && status === 'reviewed') {
            query += `, reviewed_by = $${params.length + 1}, reviewed_at = CURRENT_TIMESTAMP`;
            params.push(reviewedBy);
        }
        
        query += ` WHERE id = $${params.length + 1} RETURNING *`;
        params.push(id);
        
        const result = await pool.query(query, params);
        return result.rows[0];
    }

    // Update entire report
    static async update(id, reportData) {
        const { title, description, report_date, status } = reportData;
        const query = `
            UPDATE technician_reports 
            SET title = $1, description = $2, report_date = $3, status = $4, updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
            RETURNING *
        `;
        const values = [title, description, report_date, status, id];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    // Delete report
    static async delete(id) {
        const query = `DELETE FROM technician_reports WHERE id = $1 RETURNING id`;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    // Get report statistics
    static async getStats(filters = {}) {
        let query = `
            SELECT 
                COUNT(*) as total_reports,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reports,
                COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed_reports,
                COUNT(DISTINCT technician_id) as unique_technicians
            FROM technician_reports
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (filters.startDate) {
            query += ` AND created_at >= $${paramIndex++}`;
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            query += ` AND created_at <= $${paramIndex++}`;
            params.push(filters.endDate);
        }

        const result = await pool.query(query, params);
        return result.rows[0];
    }
}

module.exports = TechnicianReport;