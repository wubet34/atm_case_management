const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createReport,
    getAllReports,
    getMyReports,
    getReportById,
    updateReportStatus,
    updateReport,
    deleteReport,
    exportReports,
    getReportStats
} = require('../controllers/technicianReportController');

// All routes require authentication
router.use(protect);

// Routes
router.post('/', createReport);
router.get('/', getAllReports);
router.get('/my-reports', getMyReports);
router.get('/export', exportReports);
router.get('/stats', getReportStats);
router.get('/:id', getReportById);
router.put('/:id/status', updateReportStatus);
router.put('/:id', updateReport);
router.delete('/:id', deleteReport);

module.exports = router;