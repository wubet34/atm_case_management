const TechnicianReport = require('../models/TechnicianReport');

// @desc    Create a new technician report
// @route   POST /api/technician-reports
// @access  Private (Technician only)
const createReport = async (req, res) => {
    try {
        const { title, description, report_date } = req.body;
        
        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: 'Title and description are required'
            });
        }

        const technician_id = req.user.id;
        const technician_name = req.user.name;

        const reportData = {
            title,
            description,
            report_date: report_date || new Date().toISOString().split('T')[0],
            technician_id,
            technician_name
        };

        const newReport = await TechnicianReport.create(reportData);
        
        res.status(201).json({
            success: true,
            message: 'Report submitted successfully',
            data: newReport
        });
    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create report',
            error: error.message
        });
    }
};

// @desc    Get all reports (Admin only)
// @route   GET /api/technician-reports
// @access  Private/Admin
const getAllReports = async (req, res) => {
    try {
        const { status, startDate, endDate, technician_id } = req.query;
        
        const filters = { status, startDate, endDate, technician_id };
        const reports = await TechnicianReport.getAll(filters);
        const stats = await TechnicianReport.getStats(filters);
        
        res.json({
            success: true,
            data: reports,
            stats,
            count: reports.length,
            filters
        });
    } catch (error) {
        console.error('Get all reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reports',
            error: error.message
        });
    }
};

// @desc    Get reports for authenticated technician
// @route   GET /api/technician-reports/my-reports
// @access  Private (Technician)
const getMyReports = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        const technicianId = req.user.id;
        
        const filters = { status, startDate, endDate };
        const reports = await TechnicianReport.getByTechnicianId(technicianId, filters);
        
        res.json({
            success: true,
            data: reports,
            count: reports.length,
            filters
        });
    } catch (error) {
        console.error('Get my reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your reports',
            error: error.message
        });
    }
};

// @desc    Get single report by ID
// @route   GET /api/technician-reports/:id
// @access  Private (Admin or report owner)
const getReportById = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await TechnicianReport.getById(id);
        
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }
        
        if (req.user.role !== 'admin' && report.technician_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Get report by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch report',
            error: error.message
        });
    }
};

// @desc    Update report status (Admin review)
// @route   PUT /api/technician-reports/:id/status
// @access  Private/Admin
const updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!status || !['pending', 'reviewed', 'archived'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }
        
        const report = await TechnicianReport.getById(id);
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }
        
        const reviewedBy = status === 'reviewed' ? req.user.id : null;
        const updatedReport = await TechnicianReport.updateStatus(id, status, reviewedBy);
        
        res.json({
            success: true,
            message: `Report ${status === 'reviewed' ? 'reviewed' : 'updated'} successfully`,
            data: updatedReport
        });
    } catch (error) {
        console.error('Update report status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update report status',
            error: error.message
        });
    }
};

// @desc    Update entire report
// @route   PUT /api/technician-reports/:id
// @access  Private (Admin or report owner)
const updateReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, report_date, status } = req.body;
        
        const report = await TechnicianReport.getById(id);
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }
        
        if (req.user.role !== 'admin' && report.technician_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        const updatedReport = await TechnicianReport.update(id, {
            title: title || report.title,
            description: description || report.description,
            report_date: report_date || report.report_date,
            status: status || report.status
        });
        
        res.json({
            success: true,
            message: 'Report updated successfully',
            data: updatedReport
        });
    } catch (error) {
        console.error('Update report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update report',
            error: error.message
        });
    }
};

// @desc    Delete report
// @route   DELETE /api/technician-reports/:id
// @access  Private (Admin or report owner)
const deleteReport = async (req, res) => {
    try {
        const { id } = req.params;
        
        const report = await TechnicianReport.getById(id);
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }
        
        if (req.user.role !== 'admin' && report.technician_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        await TechnicianReport.delete(id);
        
        res.json({
            success: true,
            message: 'Report deleted successfully'
        });
    } catch (error) {
        console.error('Delete report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete report',
            error: error.message
        });
    }
};

// @desc    Export reports as CSV/JSON
// @route   GET /api/technician-reports/export
// @access  Private/Admin
const exportReports = async (req, res) => {
    try {
        const { format = 'json', status, startDate, endDate } = req.query;
        
        const filters = { status, startDate, endDate };
        const reports = await TechnicianReport.getAll(filters);
        
        if (format === 'csv') {
            const headers = ['ID', 'Title', 'Description', 'Report Date', 'Technician', 'Status', 'Created At'];
            const csvRows = [headers.join(',')];
            
            for (const report of reports) {
                const row = [
                    report.id,
                    `"${(report.title || '').replace(/"/g, '""')}"`,
                    `"${(report.description || '').replace(/"/g, '""')}"`,
                    report.report_date,
                    `"${(report.technician_name || '').replace(/"/g, '""')}"`,
                    report.status,
                    report.created_at
                ];
                csvRows.push(row.join(','));
            }
            
            const csv = csvRows.join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=technician_reports_${new Date().toISOString().split('T')[0]}.csv`);
            return res.send(csv);
        }
        
        res.json({
            success: true,
            data: reports,
            total: reports.length,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Export reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export reports',
            error: error.message
        });
    }
};

// @desc    Get report statistics
// @route   GET /api/technician-reports/stats
// @access  Private/Admin
const getReportStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const stats = await TechnicianReport.getStats({ startDate, endDate });
        
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Get report stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: error.message
        });
    }
};

module.exports = {
    createReport,
    getAllReports,
    getMyReports,
    getReportById,
    updateReportStatus,
    updateReport,
    deleteReport,
    exportReports,
    getReportStats
};