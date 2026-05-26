import React, { useState, useEffect } from 'react';
import {
  Bell, Moon, Sun, Lock, Shield, Mail, Eye, EyeOff, Save, X,
  Database, RefreshCw, AlertTriangle, UserCheck
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useDarkMode } from '../context/DarkModeContext';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { user, changePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Get role safely
  const userRole = user?.role || localStorage.getItem('userRole') || 'technician';
  const isAdmin = userRole === 'admin';
  const isTechnician = userRole === 'technician';
  
  // Debug log
  console.log('Settings - User role:', userRole, 'IsAdmin:', isAdmin);

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    caseUpdates: true,
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: '30',
    loginAlerts: true
  });

  // Password Change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setNotifications(settings.notifications || notifications);
        setSecuritySettings(settings.security || securitySettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const settings = {
        notifications,
        security: securitySettings,
        updatedAt: new Date().toISOString(),
        userId: user?.id,
        userRole: userRole
      };
      localStorage.setItem('appSettings', JSON.stringify(settings));
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword) {
      toast.error('Please enter current password');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    setPasswordLoading(true);
    try {
      const result = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (result.success) {
        toast.success('Password changed successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast.error(result.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const resetToDefault = () => {
    if (window.confirm('Reset all settings to default?')) {
      setNotifications({
        emailNotifications: true,
        caseUpdates: true,
      });
      setSecuritySettings({
        sessionTimeout: '30',
        loginAlerts: true
      });
      toast.success('Settings reset to default');
    }
  };

  const SettingSection = ({ title, icon: Icon, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
            <Icon size={20} className="text-orange-600 dark:text-orange-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );

  const ToggleSwitch = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${enabled ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="px-3 sm:px-4 md:px-6 pb-6">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
              Manage your application preferences
              {isAdmin && <span className="ml-2 text-orange-500">(Admin View)</span>}
              {isTechnician && <span className="ml-2 text-blue-500">(Technician View)</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetToDefault}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <RefreshCw size={16} />
              Reset
            </button>
            <button
              onClick={saveSettings}
              disabled={loading}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save size={16} />
              )}
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance Section - Both Roles */}
        <SettingSection title="Appearance" icon={Sun}>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Switch between light and dark theme</p>
              </div>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {darkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-gray-600" />}
              </button>
            </div>
          </div>
        </SettingSection>

        {/* Notifications Section - Both Roles */}
        <SettingSection title="Notifications" icon={Bell}>
          <div className="space-y-2">
            <ToggleSwitch
              enabled={notifications.emailNotifications}
              onChange={() => setNotifications({...notifications, emailNotifications: !notifications.emailNotifications})}
              label="Email Notifications"
              description="Receive updates via email"
            />
            <ToggleSwitch
              enabled={notifications.caseUpdates}
              onChange={() => setNotifications({...notifications, caseUpdates: !notifications.caseUpdates})}
              label="Case Updates"
              description="Get notified when case status changes"
            />
          </div>
        </SettingSection>

        {/* Security Section - Admin Only */}
        {isAdmin && (
          <SettingSection title="Security" icon={Shield}>
            <div className="space-y-2">
              <ToggleSwitch
                enabled={securitySettings.loginAlerts}
                onChange={() => setSecuritySettings({...securitySettings, loginAlerts: !securitySettings.loginAlerts})}
                label="Login Alerts"
                description="Get notified when a new login occurs"
              />
              
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Session Timeout</label>
                <select
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                </select>
              </div>
            </div>
          </SettingSection>
        )}

        {/* Security Info - For Technician (read-only) */}
        {isTechnician && (
          <SettingSection title="Security" icon={Shield}>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <UserCheck size={20} className="text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Account Security</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Your account is protected. Contact admin for security settings changes.</p>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Session Timeout</label>
                <select
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                </select>
              </div>
            </div>
          </SettingSection>
        )}

        {/* Change Password Section - Both Roles */}
        <SettingSection title="Change Password" icon={Lock}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter new password (min 6 characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Confirm new password"
              />
            </div>
            
            <button
              onClick={handlePasswordChange}
              disabled={passwordLoading}
              className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {passwordLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </SettingSection>
      </div>

      {/* Data Management Section - Admin Only */}
      {isAdmin && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <Database size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Data Management</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  const data = {
                    user: localStorage.getItem('user'),
                    settings: localStorage.getItem('appSettings'),
                    exportDate: new Date().toISOString()
                  };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `settings_backup_${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success('Data exported successfully');
                }}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Export Data
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Clear all application data? This action cannot be undone! You will need to login again.')) {
                    localStorage.clear();
                    toast.success('Data cleared. Page will reload.');
                    setTimeout(() => window.location.reload(), 1500);
                  }
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Clear Local Data
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              ⚠️ Clearing data will remove all local settings and require re-login.
            </p>
          </div>
        </div>
      )}

      {/* Role indicator badge for debugging */}
      <div className="mt-4 text-center text-xs text-gray-400">
        Current role: {isAdmin ? 'Administrator' : (isTechnician ? 'Technician' : 'Unknown')}
      </div>
    </div>
  );
};

export default Settings;