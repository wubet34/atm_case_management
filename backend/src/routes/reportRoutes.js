const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getCaseReport,
  getBankReport,
  getDistrictReport,
  getProblemReport,
  getTechnicianReport,
  exportReportCSV,
} = require('../controllers/reportController');

// All report routes are admin only
router.use(protect, admin);

router.get('/cases', getCaseReport);
router.get('/banks', getBankReport);
router.get('/districts', getDistrictReport);
router.get('/problems', getProblemReport);
router.get('/technicians', getTechnicianReport);
router.get('/export/csv', exportReportCSV);

module.exports = router;