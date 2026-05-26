// Remove the process.env line and hardcode the API URL or use import.meta.env for Vite
// Vite uses import.meta.env instead of process.env

import config from '../config';

const API_URL = config.apiUrl;

const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

export const reportService = {
    createReport: async (reportData) => {
        try {
            const response = await fetch(`${API_URL}/technician-reports`, {
                method: 'POST',
                headers: getAuthConfig().headers,
                body: JSON.stringify(reportData)
            });
            const data = await response.json();
            if (!response.ok) throw data;
            return data;
        } catch (error) {
            throw error;
        }
    },

    getAllReports: async (filters = {}) => {
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.technician_id) params.append('technician_id', filters.technician_id);
            
            const url = `${API_URL}/technician-reports${params.toString() ? `?${params}` : ''}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: getAuthConfig().headers
            });
            const data = await response.json();
            if (!response.ok) throw data;
            return data;
        } catch (error) {
            throw error;
        }
    },

    getMyReports: async (filters = {}) => {
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            
            const url = `${API_URL}/technician-reports/my-reports${params.toString() ? `?${params}` : ''}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: getAuthConfig().headers
            });
            const data = await response.json();
            if (!response.ok) throw data;
            return data;
        } catch (error) {
            throw error;
        }
    },

    getReportById: async (id) => {
        try {
            const response = await fetch(`${API_URL}/technician-reports/${id}`, {
                method: 'GET',
                headers: getAuthConfig().headers
            });
            const data = await response.json();
            if (!response.ok) throw data;
            return data;
        } catch (error) {
            throw error;
        }
    },

    updateReportStatus: async (id, status) => {
        try {
            const response = await fetch(`${API_URL}/technician-reports/${id}/status`, {
                method: 'PUT',
                headers: getAuthConfig().headers,
                body: JSON.stringify({ status })
            });
            const data = await response.json();
            if (!response.ok) throw data;
            return data;
        } catch (error) {
            throw error;
        }
    },

    updateReport: async (id, reportData) => {
        try {
            const response = await fetch(`${API_URL}/technician-reports/${id}`, {
                method: 'PUT',
                headers: getAuthConfig().headers,
                body: JSON.stringify(reportData)
            });
            const data = await response.json();
            if (!response.ok) throw data;
            return data;
        } catch (error) {
            throw error;
        }
    },

    deleteReport: async (id) => {
        try {
            const response = await fetch(`${API_URL}/technician-reports/${id}`, {
                method: 'DELETE',
                headers: getAuthConfig().headers
            });
            const data = await response.json();
            if (!response.ok) throw data;
            return data;
        } catch (error) {
            throw error;
        }
    },

    exportReports: async (format = 'json', filters = {}) => {
        try {
            const params = new URLSearchParams({ format });
            if (filters.status) params.append('status', filters.status);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            
            const response = await fetch(`${API_URL}/technician-reports/export?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw error;
            }
            
            if (format === 'csv') {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `technician_reports_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                return { success: true };
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            throw error;
        }
    },

    getReportStats: async (filters = {}) => {
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            
            const url = `${API_URL}/technician-reports/stats${params.toString() ? `?${params}` : ''}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: getAuthConfig().headers
            });
            const data = await response.json();
            if (!response.ok) throw data;
            return data;
        } catch (error) {
            throw error;
        }
    }
};

export default reportService;