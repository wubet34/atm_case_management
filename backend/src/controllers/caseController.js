const Case = require('../models/Case');
const User = require('../models/User');
const db = require('../config/database');
const { createNotification, emitNotification } = require('./notificationController');

// Helper to get io instance
const getIo = (req) => req.app.get('io');

// @desc    Get all cases
// @route   GET /api/cases
// @access  Private
const getCases = async (req, res) => {
  try {
    let technicianId = null;
    if (req.user.role === 'technician') {
      technicianId = req.user.id;
    }
    const cases = await Case.getAll(technicianId);
    res.json({ success: true, data: cases });
  } catch (error) {
    console.error('Error getting cases:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single case
// @route   GET /api/cases/:id
// @access  Private
const getCaseById = async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }
    res.json({ success: true, data: caseItem });
  } catch (error) {
    console.error('Error getting case by id:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new case
// @route   POST /api/cases
// @access  Private/Admin
const createCase = async (req, res) => {
  try {
    const caseData = {
      ...req.body,
      createdBy: req.user.id,
    };
    
    const caseItem = await Case.create(caseData);
    console.log('Case created:', caseItem);
    
    // Get all admin users
    const admins = await db.query(`SELECT id, name FROM users WHERE role = 'admin'`);
    console.log('Found admins:', admins.rows.length);
    
    const io = getIo(req);
    
    // Create notification for each admin
    for (const admin of admins.rows) {
      console.log(`Creating notification for admin ${admin.id}...`);
      const notification = await createNotification(
        admin.id,
        'case_created',
        'የአዲስ ጉዳይ ፈጠራ',
        `አዲስ ጉዳይ ${caseItem.case_id} በ ${caseItem.atm_name} ተፈጥሯል`,
        caseItem.id
      );
      emitNotification(io, admin.id, notification);
      console.log(`Notification sent to admin ${admin.id}`);
    }
    
    await db.query(
      `INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)`,
      [req.user.id, 'CREATE_CASE', JSON.stringify({ caseId: caseItem.case_id, atmName: caseItem.atm_name })]
    );
    
    res.status(201).json({ success: true, data: caseItem });
  } catch (error) {
    console.error('Error creating case:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update case
// @route   PUT /api/cases/:id
// @access  Private/Admin
const updateCase = async (req, res) => {
  try {
    const updatedCase = await Case.update(req.params.id, req.body);
    if (!updatedCase) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }
    res.json({ success: true, data: updatedCase });
  } catch (error) {
    console.error('Error updating case:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete case
// @route   DELETE /api/cases/:id
// @access  Private/Admin
const deleteCase = async (req, res) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    if (!caseItem) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }
    await Case.delete(req.params.id);
    res.json({ success: true, message: 'Case removed' });
  } catch (error) {
    console.error('Error deleting case:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Appoint technician to case
// @route   PUT /api/cases/:id/appoint
// @access  Private/Admin
const appointTechnician = async (req, res) => {
  try {
    const { technicianId } = req.body;
    const caseId = req.params.id;
    
    console.log('Appoint technician request:', { caseId, technicianId });
    
    if (!technicianId) {
      return res.status(400).json({ success: false, message: 'Technician ID is required' });
    }
    
    const caseItem = await Case.findById(caseId);
    if (!caseItem) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }
    
    const technician = await User.findById(technicianId);
    if (!technician) {
      return res.status(404).json({ success: false, message: 'Technician not found' });
    }
    
    console.log('Found case:', caseItem.case_id);
    console.log('Found technician:', technician.name);
    
    const updatedCase = await Case.appointTechnician(caseId, technicianId, technician.name);
    
    // Create notification for technician
    const notification = await createNotification(
      technicianId,
      'case_appointed',
      'ለእርስዎ ጉዳይ ተመድቧል',
      `እርስዎ ለጉዳይ ${updatedCase.case_id} በ ${updatedCase.atm_name} ተመድበዋል`,
      updatedCase.id
    );
    
    // Emit real-time notification to technician
    const io = getIo(req);
    emitNotification(io, technicianId, notification);
    
    // Also notify admins
    const admins = await db.query(`SELECT id FROM users WHERE role = 'admin'`);
    for (const admin of admins.rows) {
      const adminNotification = await createNotification(
        admin.id,
        'case_appointed',
        'ባለሙያ ተመድቧል',
        `${technician.name} ለጉዳይ ${updatedCase.case_id} ተመድቧል`,
        updatedCase.id
      );
      emitNotification(io, admin.id, adminNotification);
    }
    
    await db.query(
      `INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)`,
      [req.user.id, 'APPOINT_TECHNICIAN', JSON.stringify({ 
        caseId: updatedCase.case_id, 
        technician: technician.name,
        technicianId: technicianId
      })]
    );
    
    console.log('Technician appointed successfully');
    res.json({ success: true, data: updatedCase });
  } catch (error) {
    console.error('Error appointing technician:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Start work on case
// @route   PUT /api/cases/:id/start
// @access  Private/Technician
const startWork = async (req, res) => {
  try {
    const caseId = req.params.id;
    const caseItem = await Case.findById(caseId);
    
    if (!caseItem) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }
    
    if (caseItem.technician_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    const updatedCase = await Case.startWork(caseId);
    
    // Create notification for technician that work started
    const io = getIo(req);
    const notification = await createNotification(
      req.user.id,
      'case_started',
      'ሥራ ተጀምሯል',
      `በጉዳይ ${updatedCase.case_id} ላይ መሥራት ጀምረዋል`,
      updatedCase.id
    );
    emitNotification(io, req.user.id, notification);
    
    // Notify admins
    const admins = await db.query(`SELECT id FROM users WHERE role = 'admin'`);
    for (const admin of admins.rows) {
      const adminNotification = await createNotification(
        admin.id,
        'case_started',
        'ሥራ ተጀምሯል',
        `${req.user.name} በጉዳይ ${updatedCase.case_id} ላይ መሥራት ጀምረዋል`,
        updatedCase.id
      );
      emitNotification(io, admin.id, adminNotification);
    }
    
    console.log('Work started successfully for case:', updatedCase.case_id);
    res.json({ success: true, data: updatedCase });
  } catch (error) {
    console.error('Error starting work:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Complete work on case
// @route   PUT /api/cases/:id/complete
// @access  Private/Technician
const completeWork = async (req, res) => {
  try {
    const caseId = req.params.id;
    const caseItem = await Case.findById(caseId);
    
    if (!caseItem) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }
    
    if (caseItem.technician_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    const updatedCase = await Case.completeWork(caseId);
    
    // Create notification for technician that work completed
    const io = getIo(req);
    const notification = await createNotification(
      req.user.id,
      'case_completed',
      'ሥራ ተጠናቋል',
      `በጉዳይ ${updatedCase.case_id} ላይ ያከናወኑት ሥራ ተጠናቋል። እንኳን ደስ ያለዎት!`,
      updatedCase.id
    );
    emitNotification(io, req.user.id, notification);
    
    // Notify the admin who created the case
    if (caseItem.created_by) {
      const adminNotification = await createNotification(
        caseItem.created_by,
        'case_completed',
        'ጉዳይ ተጠናቋል',
        `ጉዳይ ${updatedCase.case_id} በ ${req.user.name} ተጠናቋል`,
        updatedCase.id
      );
      emitNotification(io, caseItem.created_by, adminNotification);
    }
    
    // Notify all other admins
    const admins = await db.query(`SELECT id FROM users WHERE role = 'admin'`);
    for (const admin of admins.rows) {
      if (admin.id !== caseItem.created_by) {
        const otherAdminNotification = await createNotification(
          admin.id,
          'case_completed',
          'ጉዳይ ተጠናቋል',
          `ጉዳይ ${updatedCase.case_id} በ ${req.user.name} ተጠናቋል`,
          updatedCase.id
        );
        emitNotification(io, admin.id, otherAdminNotification);
      }
    }
    
    console.log('Work completed successfully for case:', updatedCase.case_id);
    res.json({ success: true, data: updatedCase });
  } catch (error) {
    console.error('Error completing work:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Terminate case
// @route   PUT /api/cases/:id/terminate
// @access  Private/Admin
const terminateCase = async (req, res) => {
  try {
    const { reason } = req.body;
    const caseId = req.params.id;
    const caseItem = await Case.findById(caseId);
    
    if (!caseItem) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }
    
    const updatedCase = await Case.terminateCase(caseId, reason);
    
    // Notify the technician if assigned
    const io = getIo(req);
    if (caseItem.technician_id) {
      const notification = await createNotification(
        caseItem.technician_id,
        'case_terminated',
        'ጉዳይ ተቋርጧል',
        `ጉዳይ ${updatedCase.case_id} ተቋርጧል። ምክንያት: ${reason}`,
        updatedCase.id
      );
      emitNotification(io, caseItem.technician_id, notification);
    }
    
    // Notify all admins
    const admins = await db.query(`SELECT id FROM users WHERE role = 'admin'`);
    for (const admin of admins.rows) {
      const adminNotification = await createNotification(
        admin.id,
        'case_terminated',
        'ጉዳይ ተቋርጧል',
        `ጉዳይ ${updatedCase.case_id} በ ${req.user.name} ተቋርጧል። ምክንያት: ${reason}`,
        updatedCase.id
      );
      emitNotification(io, admin.id, adminNotification);
    }
    
    console.log('Case terminated successfully:', updatedCase.case_id);
    res.json({ success: true, data: updatedCase });
  } catch (error) {
    console.error('Error terminating case:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export all functions
module.exports = {
  getCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
  appointTechnician,
  startWork,
  completeWork,
  terminateCase,
};