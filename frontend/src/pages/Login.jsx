import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { Shield, User, Lock, Sun, Moon, AlertCircle, Fingerprint, ArrowRight, WifiOff } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import logo from '../assets/logo.png';
import { API_URL } from '../config';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const result = await login(email, password);
    
    if (result.success) {
      toast.success('Login successful! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } else {
      // Show specific error message
      setError(result.message);
      toast.error(result.message);
    }
    setLoading(false);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300
      ${darkMode 
        ? 'bg-linear-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-linear-to-br from-white via-gray-50 to-white'
      }`}
    >
      <Toaster position="top-right" />
      
      {/* Dark Mode Toggle */}
      <button
        onClick={toggleDarkMode}
        className={`absolute top-4 right-4 p-2.5 rounded-xl transition-all duration-300 hover:scale-110
          ${darkMode 
            ? 'bg-gray-800 text-yellow-500 hover:bg-gray-700' 
            : 'bg-white text-gray-600 hover:bg-gray-100 shadow-md'
          }`}
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="relative w-full max-w-md">
        {/* Decorative Orange Accent */}
        <div className={`absolute -top-10 -left-10 w-32 h-32 rounded-full opacity-20 blur-2xl
          ${darkMode ? 'bg-orange-500' : 'bg-orange-400'}`}
        />
        <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-2xl
          ${darkMode ? 'bg-orange-500' : 'bg-orange-400'}`}
        />
        
        {/* Login Card */}
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
            <h1 className={`text-2xl font-bold transition-colors duration-300
              ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              ATM Case Management
            </h1>
            <p className={`text-sm mt-2 transition-colors duration-300
              ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
            >
              Secure access to your dashboard
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`mb-4 p-3 rounded-lg border transition-all duration-300
              ${error.includes('Cannot connect') || error.includes('server')
                ? darkMode 
                  ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-300'
                  : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                : darkMode 
                  ? 'bg-red-500/10 border-red-500/50 text-red-300'
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}
            >
              <div className="flex items-start gap-2">
                {error.includes('Cannot connect') || error.includes('server') ? (
                  <WifiOff size={16} className="mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                )}
                <div className="text-sm">
                  {error}
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Email Address
              </label>
              <div className="relative">
                <User size={18} className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300
                  ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg transition-all duration-300
                    ${darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                    } border focus:outline-none`}
                  required
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Password
              </label>
              <div className="relative">
                <Lock size={18} className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300
                  ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-12 py-2.5 rounded-lg transition-all duration-300
                    ${darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                    } border focus:outline-none`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-xs transition-colors duration-300
                    ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className={`w-4 h-4 rounded transition-colors duration-300
                    ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}
                    focus:ring-2 focus:ring-orange-500`}
                />
                <span className={`text-sm transition-colors duration-300
                  ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  Remember me
                </span>
              </label>
              <button
                type="button"
                className={`text-sm transition-colors duration-300 hover:underline
                  ${darkMode ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-700'}`}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2
                ${darkMode 
                  ? 'bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/20' 
                  : 'bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg'
                } text-white disabled:opacity-50 disabled:cursor-not-allowed group`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Fingerprint size={18} />
                  Sign In
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Server Status Indicator (only when backend is down) */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={async () => {
                try {
                 const response = await fetch(`${API_URL}/health`);
                  if (response.ok) {
                    toast.success('Server is running');
                  }
                } catch (error) {
                  toast.error('Server is not running. Please start the backend server.');
                }
              }}
              className="text-xs text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 underline"
            >
              Check Server Status
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 text-center border-t transition-colors duration-300
            ${darkMode ? 'border-gray-800' : 'border-gray-100'}"
          >
            <p className={`text-xs transition-colors duration-300
              ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
            >
              © 2026 ATM Case Management System. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;