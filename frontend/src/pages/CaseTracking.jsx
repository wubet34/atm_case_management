import React, { useState } from 'react';
import { 
  Search, Eye, Wrench, CheckCircle, Clock, UserCheck, Filter, X, 
  MapPin, Building, Calendar, MessageSquare, CreditCard, User, AlertTriangle
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useDarkMode } from '../context/DarkModeContext';
import { useAuth } from '../context/AuthContext';
import { useCases } from '../context/CaseContext';
import CaseMap from '../components/CaseMap';

const CaseTracking = () => {
  const { darkMode } = useDarkMode();
  const { user } = useAuth();
  const { cases, startWork, completeWork, loading } = useCases();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [pendingCompleteCase, setPendingCompleteCase] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedMapCase, setSelectedMapCase] = useState(null);
  
  const handleViewOnMap = (caseItem) => {
    setSelectedMapCase(caseItem);
    setShowMapModal(true);
  };

  // Advanced filters
  const [filters, setFilters] = useState({
    caseId: '',
    bank: '',
    district: '',
    branch: '',
    status: ''
  });

  const isAdmin = user?.role === 'admin';
  const isTechnician = user?.role === 'technician';

  // Helper to get field values (handles both camelCase and snake_case)
  const getField = (obj, field) => {
    if (!obj) return '';
    const camelCase = field;
    const snakeCase = field.replace(/([A-Z])/g, '_$1').toLowerCase();
    return obj[camelCase] || obj[snakeCase] || '';
  };

  // Format date safely
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString();
    } catch {
      return '-';
    }
  };

  // Get unique values for filters
  const getUniqueValues = () => {
    let filteredCases = cases;
    if (isTechnician) {
      filteredCases = cases.filter(c => c.technician === user?.name);
    }
    
    return {
      banks: [...new Set(filteredCases.map(c => c.bank).filter(Boolean))],
      districts: [...new Set(filteredCases.map(c => c.district).filter(Boolean))],
      branches: [...new Set(filteredCases.map(c => c.branch).filter(Boolean))]
    };
  };

  const { banks, districts, branches } = getUniqueValues();
  const statuses = ['Pending', 'Appointed', 'Ongoing', 'Completed', 'Terminated'];

  // Status priority for sorting
  const getStatusPriority = (status, isTech = false) => {
    if (isTech) {
      switch(status) {
        case 'Appointed': return 1;
        case 'Ongoing': return 2;
        case 'Pending': return 3;
        case 'Completed': return 4;
        case 'Terminated': return 5;
        default: return 6;
      }
    }
    return 0;
  };

  // Filter and sort cases
  const getFilteredAndSortedCases = () => {
    let filtered = cases.filter(c => {
      if (isTechnician && c.technician !== user?.name) {
        return false;
      }
      
      const caseId = getField(c, 'caseId');
      const atmName = getField(c, 'atmName');
      
      const matchesSearch = searchTerm === '' || 
        caseId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        atmName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.bank?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.branch?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCaseId = !filters.caseId || caseId?.toLowerCase().includes(filters.caseId.toLowerCase());
      const matchesBank = !filters.bank || c.bank === filters.bank;
      const matchesDistrict = !filters.district || c.district === filters.district;
      const matchesBranch = !filters.branch || c.branch === filters.branch;
      const matchesStatus = !filters.status || c.status === filters.status;
      
      return matchesSearch && matchesCaseId && matchesBank && matchesDistrict && matchesBranch && matchesStatus;
    });

    if (isTechnician) {
      filtered.sort((a, b) => {
        const priorityDiff = getStatusPriority(a.status, true) - getStatusPriority(b.status, true);
        if (priorityDiff !== 0) return priorityDiff;
        const dateA = a.createdAt || a.created_at;
        const dateB = b.createdAt || b.created_at;
        return new Date(dateB) - new Date(dateA);
      });
    } else {
      filtered.sort((a, b) => {
        const dateA = a.createdAt || a.created_at;
        const dateB = b.createdAt || b.created_at;
        return new Date(dateB) - new Date(dateA);
      });
    }

    return filtered;
  };

  const filteredCases = getFilteredAndSortedCases();

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Appointed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Ongoing': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Terminated': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleView = (caseItem) => {
    setSelectedCase(caseItem);
    setShowViewModal(true);
  };

  const handleCompleteClick = (caseItem) => {
    setPendingCompleteCase(caseItem);
    setShowCompleteConfirm(true);
  };

  const confirmComplete = async () => {
    if (pendingCompleteCase) {
      await completeWork(pendingCompleteCase.id);
      toast.success(`Case ${getField(pendingCompleteCase, 'caseId')} has been completed successfully`);
      setShowCompleteConfirm(false);
      setPendingCompleteCase(null);
    }
  };

  const cancelComplete = () => {
    setShowCompleteConfirm(false);
    setPendingCompleteCase(null);
  };

  const resetFilters = () => {
    setFilters({
      caseId: '',
      bank: '',
      district: '',
      branch: '',
      status: ''
    });
    setSearchTerm('');
    toast.success('All filters reset');
  };

  const getTechnicianStats = () => {
    const assignedCases = cases.filter(c => c.technician === user?.name);
    return {
      appointed: assignedCases.filter(c => c.status === 'Appointed').length,
      ongoing: assignedCases.filter(c => c.status === 'Ongoing').length,
      completed: assignedCases.filter(c => c.status === 'Completed').length,
      total: assignedCases.length
    };
  };

  const techStats = isTechnician ? getTechnicianStats() : null;
  const hasActiveFilters = filters.caseId || filters.bank || filters.district || filters.branch || filters.status;

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Mobile Card Component
  const CaseCard = ({ caseItem }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-4 ${isTechnician && caseItem.status === 'Appointed' ? 'border-l-4 border-l-blue-500' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">#{getField(caseItem, 'caseId')}</span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(caseItem.status)}`}>
              {caseItem.status}
              {isTechnician && caseItem.status === 'Appointed' && <span className="ml-1">⚡</span>}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{getField(caseItem, 'atmName')}</h3>
        </div>
        <div className="flex gap-2">
          {isAdmin && caseItem.status === 'Pending' && (
            <button className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Appoint Technician">
              <UserCheck size={16} />
            </button>
          )}
          {isTechnician && caseItem.status === 'Appointed' && (
            <button onClick={() => startWork(caseItem.id)} className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors animate-pulse" title="Start Work">
              <Wrench size={16} />
            </button>
          )}
          {isTechnician && caseItem.status === 'Ongoing' && (
            <button onClick={() => handleCompleteClick(caseItem)} className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" title="Complete Case">
              <CheckCircle size={16} />
            </button>
          )}
          {isAdmin && (caseItem.status === 'Ongoing' || caseItem.status === 'Appointed') && (
            <button className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Terminate Case">
              <Clock size={16} />
            </button>
          )}
          <button onClick={() => handleView(caseItem)} className="p-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="View Details">
            <Eye size={16} />
          </button>
          <button 
            onClick={() => handleViewOnMap(caseItem)} 
            className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" 
            title="View on Map"
          >
            <MapPin size={16} />
          </button>
        </div>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Building size={14} /> Bank:</span>
          <span className="text-gray-900 dark:text-white font-medium">{caseItem.bank || '-'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><MapPin size={14} /> Location:</span>
          <span className="text-gray-900 dark:text-white">{caseItem.district || '-'} / {caseItem.branch || '-'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><CreditCard size={14} /> Case Type:</span>
          <span className="text-gray-900 dark:text-white">{getField(caseItem, 'caseType')}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><User size={14} /> Technician:</span>
          {caseItem.technician ? (
            <span className={`${isTechnician && caseItem.technician === user?.name ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-orange-600 dark:text-orange-400'}`}>
              {caseItem.technician}
              {isTechnician && caseItem.technician === user?.name && <span className="ml-1 text-xs text-green-500">(You)</span>}
            </span>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">Not assigned</span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Calendar size={14} /> Start Date:</span>
          <span className="text-gray-900 dark:text-white text-xs">
            {formatDate(caseItem.startDate || caseItem.start_date)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Clock size={14} /> End Date:</span>
          <span className="text-gray-900 dark:text-white text-xs">
            {formatDate(caseItem.endDate || caseItem.end_date)}
          </span>
        </div>
        {caseItem.comment && (
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-xs">Comment:</p>
            <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">{caseItem.comment}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="px-3 sm:px-4 md:px-6 pb-6">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Case Tracking</h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
          {isAdmin ? 'Manage and track all ATM cases' : 'View and update your assigned cases'}
        </p>
      </div>

      {/* Technician Stats Cards */}
      {isTechnician && techStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
            <p className="text-xs text-blue-600 dark:text-blue-400">Appointed</p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{techStats.appointed}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 border border-purple-100 dark:border-purple-800">
            <p className="text-xs text-purple-600 dark:text-purple-400">Ongoing</p>
            <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{techStats.ongoing}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-100 dark:border-green-800">
            <p className="text-xs text-green-600 dark:text-green-400">Completed</p>
            <p className="text-xl font-bold text-green-700 dark:text-green-300">{techStats.completed}</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 border border-orange-100 dark:border-orange-800">
            <p className="text-xs text-orange-600 dark:text-orange-400">Total</p>
            <p className="text-xl font-bold text-orange-700 dark:text-orange-300">{techStats.total}</p>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by Case ID, ATM, Bank, District, Branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
          >
            <Filter size={16} />
            Filters
            {hasActiveFilters && <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>}
          </button>
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
          >
            Reset
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Case ID</label>
                <input
                  type="text"
                  placeholder="Case ID"
                  value={filters.caseId}
                  onChange={(e) => setFilters({...filters, caseId: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Bank</label>
                <select
                  value={filters.bank}
                  onChange={(e) => setFilters({...filters, bank: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Banks</option>
                  {banks.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">District</label>
                <select
                  value={filters.district}
                  onChange={(e) => setFilters({...filters, district: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Districts</option>
                  {districts.map(district => <option key={district} value={district}>{district}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Branch</label>
                <select
                  value={filters.branch}
                  onChange={(e) => setFilters({...filters, branch: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Branches</option>
                  {branches.map(branch => <option key={branch} value={branch}>{branch}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Status</option>
                  {statuses.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-325">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">S.No</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Case ID</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bank</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">District</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Branch</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ATM Name</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Case Type</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Technician</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Start Date</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">End Date</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan="12" className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                    No cases found
                  </td>
                </tr>
              ) : (
                filteredCases.map((caseItem, index) => (
                  <tr key={caseItem.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${isTechnician && caseItem.status === 'Appointed' ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                    <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400">{index + 1}</td>
                    <td className="px-3 py-3 text-sm font-semibold text-gray-900 dark:text-white">{getField(caseItem, 'caseId')}</td>
                    <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-300">{caseItem.bank || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-300">{caseItem.district || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-300">{caseItem.branch || '-'}</td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">{getField(caseItem, 'atmName')}</td>
                    <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-300">{getField(caseItem, 'caseType')}</td>
                    <td className="px-3 py-3 text-sm">
                      {caseItem.technician ? (
                        <span className={`${isTechnician && caseItem.technician === user?.name ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-orange-600 dark:text-orange-400'}`}>
                          {caseItem.technician}
                        </span>
                      ) : <span className="text-gray-400 dark:text-gray-500">-</span>}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(caseItem.status)}`}>
                        {caseItem.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(caseItem.startDate || caseItem.start_date)}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(caseItem.endDate || caseItem.end_date)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        {isAdmin && caseItem.status === 'Pending' && (
                          <button className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Appoint Technician">
                            <UserCheck size={16} />
                          </button>
                        )}
                        {isTechnician && caseItem.status === 'Appointed' && (
                          <button onClick={() => startWork(caseItem.id)} className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors" title="Start Work">
                            <Wrench size={16} />
                          </button>
                        )}
                        {isTechnician && caseItem.status === 'Ongoing' && (
                          <button onClick={() => handleCompleteClick(caseItem)} className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" title="Complete Case">
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button onClick={() => handleView(caseItem)} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="View Details">
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleViewOnMap(caseItem)} 
                          className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" 
                          title="View on Map"
                        >
                          <MapPin size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {filteredCases.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No cases found
          </div>
        ) : (
          filteredCases.map((caseItem) => (
            <CaseCard key={caseItem.id} caseItem={caseItem} />
          ))
        )}
      </div>

      {/* Complete Confirmation Modal */}
      {showCompleteConfirm && pendingCompleteCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full rounded-xl shadow-xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                  <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={20} />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Complete Case</h2>
              </div>
            </div>
            
            <div className="p-6">
              <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Are you sure you want to mark this case as completed?
              </p>
              
              <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Case ID:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{getField(pendingCompleteCase, 'caseId')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">ATM Name:</span>
                    <span className="text-gray-900 dark:text-white">{getField(pendingCompleteCase, 'atmName')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Bank:</span>
                    <span className="text-gray-900 dark:text-white">{pendingCompleteCase.bank}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Location:</span>
                    <span className="text-gray-900 dark:text-white">{pendingCompleteCase.district} / {pendingCompleteCase.branch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Case Type:</span>
                    <span className="text-gray-900 dark:text-white">{getField(pendingCompleteCase, 'caseType')}</span>
                  </div>
                </div>
              </div>
              
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-2`}>
                This action will mark the case as completed and cannot be undone.
              </p>
            </div>
            
            <div className={`flex justify-end gap-3 p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <button
                onClick={cancelComplete}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmComplete}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <CheckCircle size={16} />
                Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Case Modal */}
      {showViewModal && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Case Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Case ID</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{getField(selectedCase, 'caseId')}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                  <span className={`text-sm font-semibold px-2 py-1 rounded-full inline-block mt-1 ${getStatusColor(selectedCase.status)}`}>
                    {selectedCase.status}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Bank</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedCase.bank || '-'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">District/Branch</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedCase.district || '-'} / {selectedCase.branch || '-'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">ATM Name</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{getField(selectedCase, 'atmName')}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Case Type</p>
                  <p className="text-sm text-gray-900 dark:text-white">{getField(selectedCase, 'caseType')}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Technician</p>
                  <p className="text-sm text-orange-600 dark:text-orange-400 font-semibold">{selectedCase.technician || 'Not assigned'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Start Date</p>
                  <p className="text-sm text-gray-900 dark:text-white">{formatDate(selectedCase.startDate || selectedCase.start_date)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">End Date</p>
                  <p className="text-sm text-gray-900 dark:text-white">{formatDate(selectedCase.endDate || selectedCase.end_date)}</p>
                </div>
                <div className="md:col-span-2 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Comment</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{selectedCase.comment || 'No comments'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowViewModal(false)} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Case Map Modal */}
      {showMapModal && selectedMapCase && (
        <CaseMap caseItem={selectedMapCase} onClose={() => setShowMapModal(false)} />
      )}
    </div>
  );
};

export default CaseTracking;