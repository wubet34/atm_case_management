import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Calendar, Shield, Edit, Save, X, 
  Camera, CheckCircle, Briefcase, Activity
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useDarkMode } from '../context/DarkModeContext';
import { useAuth } from '../context/AuthContext';
import { useCases } from '../context/CaseContext';

const Profile = () => {
  const { darkMode } = useDarkMode();
  const { user, updateProfile, loading: authLoading } = useAuth();
  const { cases, loading: casesLoading } = useCases();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    district: '',
    joinDate: '',
    avatar: ''
  });

  const [stats, setStats] = useState({
    totalCases: 0,
    completedCases: 0,
    ongoingCases: 0,
    pendingCases: 0
  });

  // Helper to get field values (handles both camelCase and snake_case)
  const getField = (obj, field) => {
    if (!obj) return '';
    const camelCase = field;
    const snakeCase = field.replace(/([A-Z])/g, '_$1').toLowerCase();
    return obj[camelCase] || obj[snakeCase] || '';
  };

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  useEffect(() => {
    if (user && cases.length > 0) {
      loadStats();
    }
  }, [user, cases]);

  const loadProfile = () => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || 'Not provided',
      role: user?.role || 'user',
      district: user?.district || 'Not specified',
      joinDate: user?.joinDate || user?.join_date || new Date().toLocaleDateString(),
      avatar: user?.avatar || ''
    });
  };

  const loadStats = () => {
    try {
      const userRole = user?.role;
      const userName = user?.name;

      let userCases = cases;
      if (userRole === 'technician') {
        userCases = cases.filter(c => c.technician === userName);
      }

      setStats({
        totalCases: userCases.length,
        completedCases: userCases.filter(c => c.status === 'Completed').length,
        ongoingCases: userCases.filter(c => c.status === 'Ongoing').length,
        pendingCases: userCases.filter(c => c.status === 'Pending' || c.status === 'Appointed').length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSave = async () => {
    if (!profileData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!profileData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!profileData.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }

    setSaving(true);
    try {
      const result = await updateProfile({
        name: profileData.name,
        phone: profileData.phone,
        district: profileData.district
      });
      
      if (result.success) {
        toast.success('Profile updated successfully');
        setIsEditing(false);
        // Reload profile data
        loadProfile();
      } else {
        toast.error(result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'technician': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getRoleIcon = () => {
    if (profileData.role === 'admin') return <Shield size={20} />;
    if (profileData.role === 'technician') return <Briefcase size={20} />;
    return <User size={20} />;
  };

  // Loading state
  if (authLoading || casesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 md:px-6 pb-6">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">View and manage your personal information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Cover Image */}
            <div className="h-24 bg-linear-to-r from-orange-500 to-orange-600"></div>
            
            {/* Avatar Section */}
            <div className="relative px-6 pb-6">
              <div className="flex justify-center -mt-12 mb-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-linear-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg border-4 border-white dark:border-gray-800">
                    {profileData.name?.charAt(0) || 'U'}
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 p-1.5 bg-orange-500 rounded-full text-white hover:bg-orange-600 transition-colors">
                      <Camera size={14} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="text-center">
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="text-center text-xl font-bold bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 w-full mb-2"
                    placeholder="Your name"
                  />
                ) : (
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profileData.name}</h2>
                )}
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getRoleBadgeColor(profileData.role)}`}>
                    {getRoleIcon()}
                    {profileData.role === 'admin' ? 'Administrator' : 'Technician'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{profileData.email}</p>
              </div>
            </div>

            {/* Stats Section */}
            <div className="border-t border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total Cases</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalCases}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Completed</span>
                  <span className="text-lg font-bold text-green-600">{stats.completedCases}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">In Progress</span>
                  <span className="text-lg font-bold text-purple-600">{stats.ongoingCases}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Pending</span>
                  <span className="text-lg font-bold text-yellow-600">{stats.pendingCases}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Profile Details */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Edit size={16} />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save size={16} />
                    )}
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 space-y-5">
              {/* Full Name */}
              <div className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <div className="sm:w-1/3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <User size={16} />
                    Full Name
                  </label>
                </div>
                <div className="sm:w-2/3 mt-1 sm:mt-0">
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{profileData.name}</p>
                  )}
                </div>
              </div>

              {/* Email - Read Only */}
              <div className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <div className="sm:w-1/3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Mail size={16} />
                    Email Address
                  </label>
                </div>
                <div className="sm:w-2/3 mt-1 sm:mt-0">
                  <p className="text-gray-900 dark:text-white">{profileData.email}</p>
                </div>
              </div>

              {/* Phone Number */}
              <div className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <div className="sm:w-1/3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Phone size={16} />
                    Phone Number
                  </label>
                </div>
                <div className="sm:w-2/3 mt-1 sm:mt-0">
                  {isEditing ? (
                    <input
                      type="tel"
                      value={profileData.phone === 'Not provided' ? '' : profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value || 'Not provided'})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{profileData.phone}</p>
                  )}
                </div>
              </div>

              {/* District */}
              <div className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <div className="sm:w-1/3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <MapPin size={16} />
                    District
                  </label>
                </div>
                <div className="sm:w-2/3 mt-1 sm:mt-0">
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.district === 'Not specified' ? '' : profileData.district}
                      onChange={(e) => setProfileData({...profileData, district: e.target.value || 'Not specified'})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter your district"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{profileData.district}</p>
                  )}
                </div>
              </div>

              {/* Role - Read Only */}
              <div className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <div className="sm:w-1/3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Shield size={16} />
                    Role
                  </label>
                </div>
                <div className="sm:w-2/3 mt-1 sm:mt-0">
                  <p className="text-gray-900 dark:text-white capitalize">{profileData.role}</p>
                </div>
              </div>

              {/* Join Date - Read Only */}
              <div className="flex flex-col sm:flex-row sm:items-center py-2">
                <div className="sm:w-1/3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Calendar size={16} />
                    Member Since
                  </label>
                </div>
                <div className="sm:w-2/3 mt-1 sm:mt-0">
                  <p className="text-gray-900 dark:text-white">{profileData.joinDate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Section */}
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity size={20} className="text-orange-500" />
              Account Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Last login</span>
                <span className="text-gray-900 dark:text-white">{new Date().toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Account status</span>
                <span className="text-green-600 flex items-center gap-1"><CheckCircle size={14} /> Active</span>
              </div>
              <div className="flex items-center justify-between text-sm py-2">
                <span className="text-gray-600 dark:text-gray-400">Cases completed</span>
                <span className="text-gray-900 dark:text-white font-semibold">{stats.completedCases} / {stats.totalCases}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;