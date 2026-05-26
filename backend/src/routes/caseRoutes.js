const express = require('express');
const router = express.Router();
const { protect, admin, technician } = require('../middleware/authMiddleware');

// Import all controller functions
const caseController = require('../controllers/caseController');

// Debug: Check if all functions exist
console.log('Available case controller functions:', Object.keys(caseController));

router.route('/')
  .get(protect, caseController.getCases)
  .post(protect, admin, caseController.createCase);

router.route('/:id')
  .get(protect, caseController.getCaseById)
  .put(protect, admin, caseController.updateCase)
  .delete(protect, admin, caseController.deleteCase);

router.put('/:id/appoint', protect, admin, caseController.appointTechnician);
router.put('/:id/start', protect, technician, caseController.startWork);
router.put('/:id/complete', protect, technician, caseController.completeWork);
router.put('/:id/terminate', protect, admin, caseController.terminateCase);

module.exports = router;