const User = require('../models/User');
const db = require('../config/database');
const bcrypt = require('bcryptjs');

const getTechnicians = async (req, res) => {
  try {
    console.log('Fetching all technicians...');
    const technicians = await User.getAllTechnicians();
    console.log('Found technicians:', technicians.length);
    res.json({ success: true, data: technicians });
  } catch (error) {
    console.error('Error getting technicians:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTechnician = async (req, res) => {
  try {
    const { name, email, password, phone, district, role = 'technician' } = req.body;
    
    console.log('Creating technician:', { name, email, phone, district });
    
    if (!name || !email || !password || !phone || !district) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    
    const newTechnician = await User.create({
      name,
      email,
      password,
      phone,
      district,
      role
    });
    
    await db.query(
      `INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)`,
      [req.user.id, 'CREATE_TECHNICIAN', JSON.stringify({ technicianName: name, technicianEmail: email })]
    );
    
    res.status(201).json({ 
      success: true, 
      data: newTechnician,
      message: 'Technician created successfully'
    });
  } catch (error) {
    console.error('Error creating technician:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTechnicianById = async (req, res) => {
  try {
    const technician = await User.findById(req.params.id);
    if (!technician || technician.role !== 'technician') {
      return res.status(404).json({ success: false, message: 'Technician not found' });
    }
    res.json({ success: true, data: technician });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTechnician = async (req, res) => {
  try {
    const technician = await User.findById(req.params.id);
    if (!technician || technician.role !== 'technician') {
      return res.status(404).json({ success: false, message: 'Technician not found' });
    }
    
    const { name, phone, district, status } = req.body;
    const updated = await User.update(req.params.id, { name, phone, district, status });
    
    await db.query(
      `INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)`,
      [req.user.id, 'UPDATE_TECHNICIAN', JSON.stringify({ technicianName: updated.name })]
    );
    
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTechnician = async (req, res) => {
  try {
    const technician = await User.findById(req.params.id);
    if (!technician || technician.role !== 'technician') {
      return res.status(404).json({ success: false, message: 'Technician not found' });
    }
    
    await User.delete(req.params.id);
    
    await db.query(
      `INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)`,
      [req.user.id, 'DELETE_TECHNICIAN', JSON.stringify({ technicianName: technician.name })]
    );
    
    res.json({ success: true, message: 'Technician removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTechnicians,
  createTechnician,
  getTechnicianById,
  updateTechnician,
  deleteTechnician,
};