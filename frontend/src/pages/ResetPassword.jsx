import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDarkMode } from '../context/DarkModeContext';
import { Lock, Eye, EyeOff, Shield, CheckCircle } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import logo from '../assets/logo.png';
import { API_URL } from '../config';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/verify-reset-token/${token}`);
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        setValidToken(false);
      }
    } catch (error) {
      console.error('Token verification error:', error);
      setValidToken(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password) {
      toast.error('Please enter a new password');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setResetSuccess(true);
        toast.success('Password reset successful!');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        toast.error(data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Unable to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className={`mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`max-w-md w-full rounded-2xl shadow-xl p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <Shield size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Invalid Reset Link</h2>
          <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            This password reset link is invalid or has expired.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`max-w-md w-full rounded-2xl shadow-xl p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
          <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Password Reset Complete!</h2>
          <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Your password has been successfully reset. You can now login with your new password.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300
      ${darkMode 
        ? 'bg-linear-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-linear-to-br from-white via-gray-50 to-white'
      }`}
    >
      <Toaster position="top-right" />
      
      <div className="relative w-full max-w-md">
        <div className={`relative rounded-2xl shadow-2xl p-8 transition-all duration-300
          ${darkMode 
            ? 'bg-gray-900/95 border border-gray-800' 
            : 'bg-white shadow-xl border border-gray-100'
          }`}
        >
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mx-auto mb-4">
              <img src={logo} alt="Logo" className="w-32 h-auto" />
            </div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Reset Password
            </h1>
            <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                New Password
              </label>
              <div className="relative">
                <Lock size={18} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  className={`w-full pl-10 pr-12 py-2.5 rounded-lg transition-all duration-300
                    ${darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500'
                    } border focus:outline-none`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Confirm New Password
              </label>
              <div className="relative">
                <Lock size={18} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className={`w-full pl-10 pr-12 py-2.5 rounded-lg transition-all duration-300
                    ${darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500'
                    } border focus:outline-none`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2
                ${darkMode 
                  ? 'bg-orange-500 hover:bg-orange-600' 
                  : 'bg-orange-500 hover:bg-orange-600'
                } text-white disabled:opacity-50`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Lock size={16} />
                  Reset Password
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className={`text-sm ${darkMode ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-700'} hover:underline`}
              >
                Back to Login
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 text-center border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}">
            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              © 2026 ATM Case Management System. All rights reserved.
            </p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              Developed by <span className="text-orange-500 font-medium">Wubet Alebachew</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;