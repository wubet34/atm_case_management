const db = require('../config/database');
const Case = require('../models/Case');

// @desc    Get case report
// @route   GET /api/reports/cases
// @access  Private/Admin
const getCaseReport = async (req, res) => {
  try {
    const { startDate, endDate, status, bank, district } = req.query;
    
    let query = `
      SELECT 
        c.*,
        u.name as technician_name,
        creator.name as created_by_name
      FROM cases c
      LEFT JOIN users u ON c.technician_id = u.id
      LEFT JOIN users creator ON c.created_by = creator.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (startDate) {
      query += ` AND c.created_at >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND c.created_at <= $${paramIndex++}`;
      params.push(endDate);
    }
    if (status && status !== 'all') {
      query += ` AND c.status = $${paramIndex++}`;
      params.push(status);
    }
    if (bank) {
      query += ` AND c.bank = $${paramIndex++}`;
      params.push(bank);
    }
    if (district) {
      query += ` AND c.district = $${paramIndex++}`;
      params.push(district);
    }
    
    query += ` ORDER BY c.created_at DESC`;
    
    const result = await db.query(query, params);
    
    // Calculate summary statistics
    const summary = {
      total: result.rows.length,
      pending: result.rows.filter(c => c.status === 'Pending').length,
      ongoing: result.rows.filter(c => c.status === 'Ongoing').length,
      appointed: result.rows.filter(c => c.status === 'Appointed').length,
      completed: result.rows.filter(c => c.status === 'Completed').length,
      terminated: result.rows.filter(c => c.status === 'Terminated').length,
      urgent: result.rows.filter(c => c.priority === 'Urgent').length,
      high: result.rows.filter(c => c.priority === 'High').length,
      medium: result.rows.filter(c => c.priority === 'Medium').length,
      low: result.rows.filter(c => c.priority === 'Low').length
    };
    
    res.json({
      success: true,
      data: result.rows,
      summary,
      filters: { startDate, endDate, status, bank, district }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get bank-wise report
// @route   GET /api/reports/banks
// @access  Private/Admin
const getBankReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        bank,
        COUNT(*) as total_cases,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'Ongoing' THEN 1 END) as ongoing,
        COUNT(CASE WHEN status = 'Terminated' THEN 1 END) as terminated,
        ROUND(COUNT(CASE WHEN status = 'Completed' THEN 1 END) * 100.0 / COUNT(*), 2) as completion_rate
      FROM cases
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (startDate) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(endDate);
    }
    
    query += ` GROUP BY bank ORDER BY total_cases DESC`;
    
    const result = await db.query(query, params);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get district-wise report
// @route   GET /api/reports/districts
// @access  Private/Admin
const getDistrictReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        district,
        COUNT(*) as total_cases,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'Ongoing' THEN 1 END) as ongoing,
        ROUND(COUNT(CASE WHEN status = 'Completed' THEN 1 END) * 100.0 / COUNT(*), 2) as completion_rate
      FROM cases
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (startDate) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(endDate);
    }
    
    query += ` GROUP BY district ORDER BY total_cases DESC`;
    
    const result = await db.query(query, params);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get problem type report
// @route   GET /api/reports/problems
// @access  Private/Admin
const getProblemReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        case_type as problem_type,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as resolved,
        AVG(EXTRACT(EPOCH FROM (end_date - start_date))/3600) as avg_resolution_hours,
        ROUND(COUNT(CASE WHEN status = 'Completed' THEN 1 END) * 100.0 / COUNT(*), 2) as resolution_rate
      FROM cases
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (startDate) {
      query += ` AND created_at >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND created_at <= $${paramIndex++}`;
      params.push(endDate);
    }
    
    query += ` GROUP BY case_type ORDER BY total_reports DESC`;
    
    const result = await db.query(query, params);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get technician performance report
// @route   GET /api/reports/technicians
// @access  Private/Admin
const getTechnicianReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        u.id as technician_id,
        u.name as technician_name,
        u.district,
        COUNT(c.id) as assigned_cases,
        COUNT(CASE WHEN c.status = 'Completed' THEN 1 END) as completed_cases,
        ROUND(COUNT(CASE WHEN c.status = 'Completed' THEN 1 END) * 100.0 / COUNT(c.id), 2) as completion_rate,
        AVG(EXTRACT(EPOCH FROM (c.end_date - c.start_date))/3600) as avg_completion_hours
      FROM users u
      LEFT JOIN cases c ON u.id = c.technician_id
      WHERE u.role = 'technician'
    `;
    const params = [];
    let paramIndex = 1;
    
    if (startDate) {
      query += ` AND c.created_at >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND c.created_at <= $${paramIndex++}`;
      params.push(endDate);
    }
    
    query += ` GROUP BY u.id, u.name, u.district ORDER BY completed_cases DESC`;
    
    const result = await db.query(query, params);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export report as CSV
// @route   GET /api/reports/export/csv
// @access  Private/Admin
const exportReportCSV = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    let data = [];
    let filename = '';
    
    switch(type) {
      case 'cases':
        const casesResult = await db.query(`
          SELECT case_id, atm_name, bank, district, branch, case_type, 
                 status, priority, technician, created_at, completed_at
          FROM cases
          WHERE ($1::date IS NULL OR created_at >= $1)
          AND ($2::date IS NULL OR created_at <= $2)
          ORDER BY created_at DESC
        `, [startDate || null, endDate || null]);
        data = casesResult.rows;
        filename = `cases_report_${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      case 'technicians':
        const techResult = await db.query(`
          SELECT u.name, u.email, u.phone, u.district, u.status,
                 COUNT(c.id) as assigned_cases,
                 COUNT(CASE WHEN c.status = 'Completed' THEN 1 END) as completed_cases
          FROM users u
          LEFT JOIN cases c ON u.id = c.technician_id
          WHERE u.role = 'technician'
          GROUP BY u.id
          ORDER BY completed_cases DESC
        `);
        data = techResult.rows;
        filename = `technicians_report_${new Date().toISOString().split('T')[0]}.csv`;
        break;
        
      default:
        return res.status(400).json({ success: false, message: 'Invalid report type' });
    }
    
    // Convert to CSV
    if (data.length === 0) {
      return res.status(404).json({ success: false, message: 'No data found' });
    }
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header] || '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    const csv = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csv);
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCaseReport,
  getBankReport,
  getDistrictReport,
  getProblemReport,
  getTechnicianReport,
  exportReportCSV
};