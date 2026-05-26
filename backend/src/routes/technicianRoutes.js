const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getTechnicians,
  createTechnician,
  getTechnicianById,
  updateTechnician,
  deleteTechnician,
} = require('../controllers/technicianController');

router.route('/')
  .get(protect, admin, getTechnicians)
  .post(protect, admin, createTechnician);

router.route('/:id')
  .get(protect, admin, getTechnicianById)
  .put(protect, admin, updateTechnician)
  .delete(protect, admin, deleteTechnician);

module.exports = router;