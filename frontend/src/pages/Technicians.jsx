import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Edit, Trash2, Eye, Search, X, UserPlus,
  Mail, Phone, MapPin, Calendar, CheckCircle, Shield, Key, Copy, EyeOff, Filter
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useDarkMode } from '../context/DarkModeContext';
import { useCases } from '../context/CaseContext';
import { technicianAPI } from '../services/api';

const Technicians = () => {
  const { darkMode } = useDarkMode();
  const { refreshTechnicians } = useCases();
  const [loading, setLoading] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newCredentials, setNewCredentials] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [editingTechnician, setEditingTechnician] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showPassword, setShowPassword] = useState(false);

  // Advanced filters
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    district: '',
    status: 'all'
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    district: '',
    status: 'Active',
    joinDate: new Date().toISOString().split('T')[0],
    password: ''
  });

  const districts = ['Bole', 'Kirkos', 'Yeka', 'Gulele', 'Kolfe', 'Addis Ketema', 'Nifas Silk', 'Lideta', 'Arada'];
  const statuses = ['Active', 'Inactive', 'On Leave'];

  useEffect(() => {
    loadTechnicians();
  }, []);

  const loadTechnicians = async () => {
    setLoading(true);
    try {
      const response = await technicianAPI.getAll();
      if (response.success) {
        setTechnicians(response.data);
      } else {
        toast.error(response.message || 'Failed to load technicians');
      }
    } catch (error) {
      console.error('Error loading technicians:', error);
      toast.error(error.message || 'Failed to load technicians');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('Name is required');
      return;
    }
    if (!formData.email) {
      toast.error('Email is required');
      return;
    }
    if (!formData.phone) {
      toast.error('Phone is required');
      return;
    }
    if (!formData.district) {
      toast.error('District is required');
      return;
    }
    if (!formData.password && !editingTechnician) {
      toast.error('Password is required for new technician');
      return;
    }
    if (formData.password && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (editingTechnician) {
        const updateData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          district: formData.district,
          status: formData.status
        };
        
        const response = await technicianAPI.update(editingTechnician.id, updateData);
        
        if (response.success) {
          await loadTechnicians();
          await refreshTechnicians();
          toast.success('Technician updated successfully');
          setShowModal(false);
          resetForm();
        } else {
          toast.error(response.message || 'Failed to update technician');
        }
      } else {
        const technicianData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          district: formData.district,
          status: formData.status,
          role: 'technician'
        };
        
        const response = await technicianAPI.create(technicianData);
        
        if (response.success) {
          await loadTechnicians();
          await refreshTechnicians();
          
          // Show credentials modal with the password admin entered
          setNewCredentials({
            name: formData.name,
            email: formData.email,
            password: formData.password
          });
          setShowCredentialsModal(true);
          
          toast.success('Technician added successfully');
          setShowModal(false);
          resetForm();
        } else {
          toast.error(response.message || 'Failed to add technician');
        }
      }
    } catch (error) {
      console.error('Error saving technician:', error);
      toast.error(error.message || 'Failed to save technician');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (technician) => {
    if (window.confirm(`Are you sure you want to delete ${technician.name}?`)) {
      setLoading(true);
      try {
        const response = await technicianAPI.delete(technician.id);
        if (response.success) {
          await loadTechnicians();
          await refreshTechnicians();
          toast.success('Technician deleted successfully');
        } else {
          toast.error(response.message || 'Failed to delete technician');
        }
      } catch (error) {
        console.error('Error deleting technician:', error);
        toast.error(error.message || 'Failed to delete technician');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (technician) => {
    setEditingTechnician(technician);
    setFormData({
      name: technician.name,
      email: technician.email,
      phone: technician.phone,
      district: technician.district,
      status: technician.status,
      joinDate: technician.joinDate || new Date().toISOString().split('T')[0],
      password: ''
    });
    setShowModal(true);
  };

  const handleView = (technician) => {
    setSelectedTechnician(technician);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      district: '',
      status: 'Active',
      joinDate: new Date().toISOString().split('T')[0],
      password: ''
    });
    setEditingTechnician(null);
  };

  const resetFilters = () => {
    setFilters({
      name: '',
      email: '',
      district: '',
      status: 'all'
    });
    setSearchTerm('');
    setFilterStatus('all');
    toast.success('All filters reset');
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Inactive': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'On Leave': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Filter technicians
  const filteredTechnicians = technicians.filter(t => {
    const matchesSearch = searchTerm === '' || 
      t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.district?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesName = !filters.name || t.name?.toLowerCase().includes(filters.name.toLowerCase());
    const matchesEmail = !filters.email || t.email?.toLowerCase().includes(filters.email.toLowerCase());
    const matchesDistrict = !filters.district || t.district === filters.district;
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    
    return matchesSearch && matchesName && matchesEmail && matchesDistrict && matchesStatus;
  });

  const hasActiveFilters = filters.name || filters.email || filters.district || filterStatus !== 'all';

  return (
    <div className="px-3 sm:px-4 md:px-6 pb-6">
      <Toaster position="top-right" />
      
      <div className="mb-6 sm:mb-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Technicians</h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">Manage your technician team</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <UserPlus size={18} />
            Add Technician
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Technicians</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{technicians.length}</p>
            </div>
            <div className="bg-orange-100 dark:bg-orange-900/20 p-3 rounded-xl">
              <Users size={20} className="text-orange-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Technicians</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {technicians.filter(t => t.status === 'Active').length}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-xl">
              <CheckCircle size={20} className="text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">On Leave</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {technicians.filter(t => t.status === 'On Leave').length}
              </p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-xl">
              <Shield size={20} className="text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Inactive</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {technicians.filter(t => t.status === 'Inactive').length}
              </p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-xl">
              <Shield size={20} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, or district..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg flex items-center gap-2 hover:opacity-90 transition-colors"
          >
            <Filter size={18} />
            Advanced Filters
            {hasActiveFilters && <span className="w-2 h-2 bg-white rounded-full"></span>}
          </button>
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  placeholder="Filter by name"
                  value={filters.name}
                  onChange={(e) => setFilters({...filters, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <input
                  type="text"
                  placeholder="Filter by email"
                  value={filters.email}
                  onChange={(e) => setFilters({...filters, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">District</label>
                <select
                  value={filters.district}
                  onChange={(e) => setFilters({...filters, district: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Districts</option>
                  {districts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Status</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Technicians Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill().map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))
        ) : filteredTechnicians.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            No technicians found
          </div>
        ) : (
          filteredTechnicians.map((technician) => (
            <div key={technician.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                      {technician.name?.charAt(0) || 'T'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{technician.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{technician.district}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(technician.status)}`}>
                    {technician.status}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">{technician.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">{technician.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">{technician.district}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Joined: {technician.joinDate ? new Date(technician.joinDate).toLocaleDateString() : '-'}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{technician.status}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleView(technician)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="View">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => handleEdit(technician)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(technician)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingTechnician ? 'Edit Technician' : 'Add New Technician'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Enter full name" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email <span className="text-red-500">*</span></label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="technician@example.com" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone <span className="text-red-500">*</span></label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="0911123456" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">District <span className="text-red-500">*</span></label>
                  <select value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="">Select District</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Join Date</label>
                  <input type="date" value={formData.joinDate} onChange={(e) => setFormData({...formData, joinDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>

                {/* Password Field - Only for new technician */}
                {!editingTechnician && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Key size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Enter password (min 6 characters)"
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Password must be at least 6 characters. Share this password with the technician.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
              <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg disabled:opacity-50">
                {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : (editingTechnician ? 'Update Technician' : 'Add Technician')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && newCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Key size={20} className="text-green-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Login Credentials</h2>
              </div>
              <button onClick={() => setShowCredentialsModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            
            <div className="p-6">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-4">
                <p className="text-sm text-green-700 dark:text-green-400">Technician added! Share these credentials.</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-900 dark:text-white">{newCredentials.name}</span>
                    <button onClick={() => copyToClipboard(newCredentials.name, 'Name')} className="p-1 text-gray-400 hover:text-orange-500"><Copy size={16} /></button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-900 dark:text-white">{newCredentials.email}</span>
                    <button onClick={() => copyToClipboard(newCredentials.email, 'Email')} className="p-1 text-gray-400 hover:text-orange-500"><Copy size={16} /></button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                  <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <code className="text-sm font-mono font-bold text-orange-600 dark:text-orange-400">{newCredentials.password}</code>
                    <button onClick={() => copyToClipboard(newCredentials.password, 'Password')} className="p-1 text-gray-400 hover:text-orange-500"><Copy size={16} /></button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  ⚠️ Make sure to save these credentials. The technician will need them to login.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowCredentialsModal(false)} className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg">I've Saved</button>
            </div>
          </div>
        </div>
      )}

      {/* View Technician Modal */}
      {showViewModal && selectedTechnician && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Technician Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg"><p className="text-xs text-gray-500">Full Name</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedTechnician.name}</p></div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg"><p className="text-xs text-gray-500">Status</p><span className={`text-sm font-semibold px-2 py-1 rounded-full inline-block mt-1 ${getStatusColor(selectedTechnician.status)}`}>{selectedTechnician.status}</span></div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg"><p className="text-xs text-gray-500">Email</p><p className="text-sm text-gray-900 dark:text-white">{selectedTechnician.email}</p></div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg"><p className="text-xs text-gray-500">Phone</p><p className="text-sm text-gray-900 dark:text-white">{selectedTechnician.phone}</p></div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg"><p className="text-xs text-gray-500">District</p><p className="text-sm text-gray-900 dark:text-white">{selectedTechnician.district}</p></div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg"><p className="text-xs text-gray-500">Join Date</p><p className="text-sm text-gray-900 dark:text-white">{selectedTechnician.joinDate ? new Date(selectedTechnician.joinDate).toLocaleDateString() : '-'}</p></div>
              </div>
            </div>
            
            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowViewModal(false)} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Technicians;