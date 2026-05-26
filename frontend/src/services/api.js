const API_URL = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

const apiCall = async (endpoint, method = 'GET', data = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    method,
    headers,
  };
  
  if (data) {
    config.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('API Error:', error);
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server. Please make sure the backend is running on port 5000');
    }
    throw error;
  }
};

// Auth APIs
export const authAPI = {
  login: (email, password) => apiCall('/auth/login', 'POST', { email, password }),
  getProfile: () => apiCall('/auth/profile'),
  updateProfile: (data) => apiCall('/auth/profile', 'PUT', data),
  changePassword: (data) => apiCall('/auth/change-password', 'PUT', data),
  register: (userData) => apiCall('/auth/register', 'POST', userData),
};

// Case APIs
export const caseAPI = {
  getAll: () => apiCall('/cases'),
  getById: (id) => apiCall(`/cases/${id}`),
  create: (data) => apiCall('/cases', 'POST', data),
  update: (id, data) => apiCall(`/cases/${id}`, 'PUT', data),
  delete: (id) => apiCall(`/cases/${id}`, 'DELETE'),
  appointTechnician: (id, technicianId) => apiCall(`/cases/${id}/appoint`, 'PUT', { technicianId }),
  startWork: (id) => apiCall(`/cases/${id}/start`, 'PUT'),
  completeWork: (id) => apiCall(`/cases/${id}/complete`, 'PUT'),
  terminateCase: (id, reason) => apiCall(`/cases/${id}/terminate`, 'PUT', { reason }),
};

// Technician APIs
export const technicianAPI = {
  getAll: () => apiCall('/technicians'),
  getById: (id) => apiCall(`/technicians/${id}`),
  create: (data) => apiCall('/technicians', 'POST', data),  // Make sure this exists
  update: (id, data) => apiCall(`/technicians/${id}`, 'PUT', data),
  delete: (id) => apiCall(`/technicians/${id}`, 'DELETE'),
};

// Notification APIs
export const notificationAPI = {
  getAll: () => apiCall('/notifications'),
  markAsRead: (id) => apiCall(`/notifications/${id}/read`, 'PUT'),
  markAllAsRead: () => apiCall('/notifications/mark-all-read', 'PUT'),
  delete: (id) => apiCall(`/notifications/${id}`, 'DELETE'),
  clearAll: () => apiCall('/notifications/clear-all', 'DELETE'),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => apiCall('/dashboard/stats'),
};