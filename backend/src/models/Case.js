const db = require('../config/database');

const Case = {
  // Generate case ID
  async generateCaseId() {
    const result = await db.query(`SELECT COUNT(*) FROM cases`);
    const count = parseInt(result.rows[0].count);
    return `CAS-${String(count + 1).padStart(3, '0')}`;
  },

  // Create case
  async create(caseData) {
    const caseId = await this.generateCaseId();
    const { atmName, bank, district, branch, caseType, comment, priority, createdBy } = caseData;
    
    const result = await db.query(
      `INSERT INTO cases (case_id, atm_name, bank, district, branch, case_type, comment, priority, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [caseId, atmName, bank, district, branch, caseType, comment, priority, createdBy]
    );
    return result.rows[0];
  },

  // Get all cases
  async getAll(technicianId = null) {
    let query = `
      SELECT c.*, u.name as creator_name 
      FROM cases c
      LEFT JOIN users u ON c.created_by = u.id
    `;
    const params = [];
    
    if (technicianId) {
      query += ` WHERE c.technician_id = $1`;
      params.push(technicianId);
    }
    
    query += ` ORDER BY c.created_at DESC`;
    
    const result = await db.query(query, params);
    return result.rows;
  },

  // Get case by id
  async findById(id) {
    const result = await db.query(
      `SELECT c.*, u.name as creator_name 
       FROM cases c
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  // Get case by case_id
  async findByCaseId(caseId) {
    const result = await db.query(
      `SELECT * FROM cases WHERE case_id = $1`,
      [caseId]
    );
    return result.rows[0];
  },

  // Update case
  async update(id, caseData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    if (caseData.atmName !== undefined) {
      fields.push(`atm_name = $${paramIndex++}`);
      values.push(caseData.atmName);
    }
    if (caseData.bank !== undefined) {
      fields.push(`bank = $${paramIndex++}`);
      values.push(caseData.bank);
    }
    if (caseData.district !== undefined) {
      fields.push(`district = $${paramIndex++}`);
      values.push(caseData.district);
    }
    if (caseData.branch !== undefined) {
      fields.push(`branch = $${paramIndex++}`);
      values.push(caseData.branch);
    }
    if (caseData.caseType !== undefined) {
      fields.push(`case_type = $${paramIndex++}`);
      values.push(caseData.caseType);
    }
    if (caseData.comment !== undefined) {
      fields.push(`comment = $${paramIndex++}`);
      values.push(caseData.comment);
    }
    if (caseData.priority !== undefined) {
      fields.push(`priority = $${paramIndex++}`);
      values.push(caseData.priority);
    }
    
    fields.push(`updated_at = NOW()`);
    
    if (fields.length === 0) return null;
    
    values.push(id);
    const query = `UPDATE cases SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Appoint technician
  async appointTechnician(caseId, technicianId, technicianName) {
    const result = await db.query(
      `UPDATE cases 
       SET status = 'Appointed', 
           technician_id = $1, 
           technician = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [technicianId, technicianName, caseId]
    );
    return result.rows[0];
  },

  // Start work
  async startWork(caseId) {
    const result = await db.query(
      `UPDATE cases 
       SET status = 'Ongoing', 
           start_date = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [caseId]
    );
    return result.rows[0];
  },

  // Complete work
 async completeWork(caseId) {
    const result = await db.query(
      `UPDATE cases 
       SET status = 'Completed', 
           end_date = CURRENT_TIMESTAMP,
           completed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [caseId]
    );
    return result.rows[0];
  },

  // Terminate case
  async terminateCase(caseId, reason) {
    const result = await db.query(
      `UPDATE cases 
       SET status = 'Terminated', 
           termination_reason = $1,
           terminated_at = NOW(),
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [reason, caseId]
    );
    return result.rows[0];
  },

  // Delete case
  async delete(id) {
    await db.query(`DELETE FROM cases WHERE id = $1`, [id]);
  },

  // Get dashboard stats
  async getStats(userId = null, role = null) {
    let query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'Ongoing' THEN 1 END) as ongoing,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'Terminated' THEN 1 END) as terminated
      FROM cases
    `;
    
    if (role === 'technician' && userId) {
      query += ` WHERE technician_id = ${userId}`;
    }
    
    const result = await db.query(query);
    return result.rows[0];
  },
};

module.exports = Case;