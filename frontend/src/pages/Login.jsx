import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { Shield, User, Lock, Sun, Moon, AlertCircle, Fingerprint, ArrowRight, WifiOff, Mail, Send, Copy, ExternalLink } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import logo from '../assets/logo.png';
import { API_URL } from '../config';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showResetLinkModal, setShowResetLinkModal] = useState(false);
  const [generatedResetLink, setGeneratedResetLink] = useState('');
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
      setError(result.message);
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }
    
    setResetLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        if (data.resetLink) {
          setGeneratedResetLink(data.resetLink);
          setShowResetLinkModal(true);
          setResetSent(true);
        } else {
          setResetSent(true);
          toast.success('Password reset link generated');
        }
      } else {
        toast.error(data.message || 'Failed to generate reset link');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('Unable to process request. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedResetLink);
    toast.success('Reset link copied to clipboard!');
  };

  const openResetLink = () => {
    window.open(generatedResetLink, '_blank');
    setShowResetLinkModal(false);
    setShowForgotPassword(false);
    setResetSent(false);
    setResetEmail('');
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
          {!showForgotPassword ? (
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
                  onClick={() => setShowForgotPassword(true)}
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
          ) : (
            /* Forgot Password Form */
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="text-center mb-4">
                <Mail size={48} className={`mx-auto mb-3 ${darkMode ? 'text-orange-400' : 'text-orange-500'}`} />
                <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Reset Password
                </h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Enter your email address to reset your password.
                </p>
              </div>

              {!resetSent ? (
                <>
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                      ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={18} className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300
                        ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
                      />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="Enter your registered email"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-lg transition-all duration-300
                          ${darkMode 
                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500' 
                            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                          } border focus:outline-none`}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className={`flex-1 py-2.5 rounded-lg transition-all duration-300
                        ${darkMode 
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className={`flex-1 py-2.5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2
                        ${darkMode 
                          ? 'bg-orange-500 hover:bg-orange-600' 
                          : 'bg-orange-500 hover:bg-orange-600'
                        } text-white disabled:opacity-50`}
                    >
                      {resetLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Send size={16} />
                          Reset Password
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-green-900/20 border border-green-500/50' : 'bg-green-50 border border-green-200'}`}>
                  <p className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-700'}`}>
                    Password reset link has been generated.
                    {!showResetLinkModal && " Please check your email or click the button below."}
                  </p>
                  {!showResetLinkModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setResetSent(false);
                        setResetEmail('');
                      }}
                      className={`mt-4 text-sm font-medium hover:underline ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}
                    >
                      Back to Login
                    </button>
                  )}
                </div>
              )}
            </form>
          )}

          {/* Server Status Indicator */}
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
                  toast.error('Server is not running');
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
            <p className={`text-xs mt-1 transition-colors duration-300
              ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}
            >
              Developed by <span className="text-orange-500 font-medium">Wubet Alebachew</span>
            </p>
          </div>
        </div>
      </div>

      {/* Reset Link Modal */}
      {showResetLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full rounded-xl shadow-xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Password Reset Link</h2>
            </div>
            
            <div className="p-6">
              <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Click the button below to reset your password:
              </p>
              
              <div className={`p-3 rounded-lg mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className="text-xs break-all font-mono">{generatedResetLink}</p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2"
                >
                  <Copy size={16} />
                  Copy Link
                </button>
                <button
                  onClick={openResetLink}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} />
                  Open Reset Page
                </button>
              </div>
            </div>
            
            <div className={`flex justify-end p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <button
                onClick={() => {
                  setShowResetLinkModal(false);
                  setShowForgotPassword(false);
                  setResetSent(false);
                  setResetEmail('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;