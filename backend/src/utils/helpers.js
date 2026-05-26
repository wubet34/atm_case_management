// Format date to local string
const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '-';
  const d = new Date(date);
  
  switch(format) {
    case 'YYYY-MM-DD':
      return d.toISOString().split('T')[0];
    case 'DD/MM/YYYY':
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    case 'MM/DD/YYYY':
      return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;
    case 'full':
      return d.toLocaleString();
    default:
      return d.toLocaleDateString();
  }
};

// Format time ago
const timeAgo = (date) => {
  if (!date) return '-';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return `${interval} year${interval > 1 ? 's' : ''} ago`;
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return `${interval} month${interval > 1 ? 's' : ''} ago`;
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `${interval} day${interval > 1 ? 's' : ''} ago`;
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `${interval} hour${interval > 1 ? 's' : ''} ago`;
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return `${interval} minute${interval > 1 ? 's' : ''} ago`;
  
  return 'Just now';
};

// Generate random string
const generateRandomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Validate email
const isValidEmail = (email) => {
  const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

// Validate phone number (Ethiopian format)
const isValidPhone = (phone) => {
  const re = /^09[0-9]{8}$/;
  return re.test(phone);
};

// Paginate results
const paginate = (data, page = 1, limit = 10) => {
  const start = (page - 1) * limit;
  const end = page * limit;
  const paginatedData = data.slice(start, end);
  
  return {
    data: paginatedData,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: data.length,
      totalPages: Math.ceil(data.length / limit)
    }
  };
};

// Filter null/undefined values from object
const filterNullValues = (obj) => {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      result[key] = value;
    }
  }
  return result;
};

// Calculate percentage
const calculatePercentage = (part, total) => {
  if (total === 0) return 0;
  return ((part / total) * 100).toFixed(2);
};

// Get status badge color
const getStatusBadgeColor = (status) => {
  const colors = {
    'Pending': 'yellow',
    'Appointed': 'blue',
    'Ongoing': 'purple',
    'Completed': 'green',
    'Terminated': 'red',
    'Active': 'green',
    'Inactive': 'red',
    'On Leave': 'yellow'
  };
  return colors[status] || 'gray';
};

// Get priority badge color
const getPriorityBadgeColor = (priority) => {
  const colors = {
    'Urgent': 'red',
    'High': 'orange',
    'Medium': 'yellow',
    'Low': 'green'
  };
  return colors[priority] || 'gray';
};

// Sleep/Delay function
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Deep clone object
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Capitalize first letter
const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Truncate text
const truncate = (str, length = 50) => {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};

module.exports = {
  formatDate,
  timeAgo,
  generateRandomString,
  isValidEmail,
  isValidPhone,
  paginate,
  filterNullValues,
  calculatePercentage,
  getStatusBadgeColor,
  getPriorityBadgeColor,
  sleep,
  deepClone,
  capitalize,
  truncate
};