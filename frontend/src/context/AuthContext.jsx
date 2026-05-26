import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import socketService from '../services/socket';

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("token");
  });

  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      
      if (token && savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setIsAuthenticated(true);
          
          // Connect to socket after session check
          socketService.connect(token, userData.id);
        } catch (error) {
          console.error('Session check error:', error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const login = async (email, password) => {
    setAuthLoading(true);
    try {
      const response = await authAPI.login(email, password);
      
      if (response && response.success) {
        const token = response.token;
        const userData = response.user;
        
        if (!token) {
          return { success: false, message: 'Server error: No token received' };
        }
        
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        
        setUser(userData);
        setIsAuthenticated(true);
        
        // Connect to socket after login
        socketService.connect(token, userData.id);
        
        return { success: true };
      }
      return { success: false, message: response?.message || 'Invalid email or password' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message || 'Login failed' };
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    socketService.disconnect();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (data) => {
    setAuthLoading(true);
    try {
      const response = await authAPI.updateProfile(data);
      if (response && response.success) {
        const updatedUser = { ...user, ...response.data };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { success: true };
      }
      return { success: false, message: response?.message || 'Failed to update profile' };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: error.message || 'Failed to update profile' };
    } finally {
      setAuthLoading(false);
    }
  };

  const changePassword = async (data) => {
    setAuthLoading(true);
    try {
      const response = await authAPI.changePassword(data);
      if (response && response.success) {
        return { success: true };
      }
      return { success: false, message: response?.message || 'Failed to change password' };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: error.message || 'Failed to change password' };
    } finally {
      setAuthLoading(false);
    }
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const isAdmin = user?.role === 'admin';
  const isTechnician = user?.role === 'technician';

  const value = {
    user,
    isAuthenticated,
    loading,
    authLoading,
    login,
    logout,
    updateProfile,
    changePassword,
    hasRole,
    isAdmin,
    isTechnician
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Also export the context itself if needed elsewhere
export { AuthContext };