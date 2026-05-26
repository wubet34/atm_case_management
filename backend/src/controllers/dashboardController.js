const Case = require('../models/Case');

const getDashboardStats = async (req, res) => {
  try {
    const stats = await Case.getStats(req.user.id, req.user.role);
    res.json({ success: true, data: { stats } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
};