import React, { useState, useEffect } from 'react';
import { 
  Search, Eye, Wrench, CheckCircle, Clock, 
  MapPin, Building, Calendar, User, Filter, X,
  AlertCircle, CreditCard
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useDarkMode } from '../../context/DarkModeContext';
import { useAuth } from '../../context/AuthContext';
import { useCases } from '../../context/CaseContext';

const MyAssignedCases = () => {
  const { darkMode } = useDarkMode();
  const { user } = useAuth();
  const { cases, startWork, completeWork, loading } = useCases();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

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
      return new Date(dateString).toLocaleDateString();
    } catch {
      return '-';
    }
  };

  // Get only cases assigned to current technician
  const myCases = cases.filter(c => c.technician === user?.name);

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

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'High': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
  };

  const handleView = (caseItem) => {
    setSelectedCase(caseItem);
    setShowViewModal(true);
  };

  // Filter cases
  const filteredCases = myCases.filter(c => {
    const caseId = getField(c, 'caseId');
    const atmName = getField(c, 'atmName');
    const bank = c.bank;
    
    const matchesSearch = searchTerm === '' || 
      caseId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      atmName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bank?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Sort cases: Appointed first, then Ongoing, then others
  const sortedCases = [...filteredCases].sort((a, b) => {
    const statusOrder = { Appointed: 1, Ongoing: 2, Pending: 3, Completed: 4, Terminated: 5 };
    return (statusOrder[a.status] || 6) - (statusOrder[b.status] || 6);
  });

  const stats = {
    total: myCases.length,
    appointed: myCases.filter(c => c.status === 'Appointed').length,
    ongoing: myCases.filter(c => c.status === 'Ongoing').length,
    completed: myCases.filter(c => c.status === 'Completed').length
  };

  // Loading state
  if (loading) {
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">My Assigned Cases</h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
          View and manage cases assigned to you
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400">Total Assigned</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-100 dark:border-yellow-800">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">Appointed</p>
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.appointed}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
          <p className="text-sm text-purple-600 dark:text-purple-400">In Progress</p>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.ongoing}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
          <p className="text-sm text-green-600 dark:text-green-400">Completed</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.completed}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by Case ID, ATM Name, or Bank..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="Appointed">Appointed</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Cases Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedCases.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            <Clock size={48} className="mx-auto mb-3 opacity-50" />
            <p>No cases assigned to you yet</p>
            <p className="text-sm mt-1">When cases are assigned, they will appear here</p>
          </div>
        ) : (
          sortedCases.map((caseItem) => (
            <div key={caseItem.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow overflow-hidden
              ${caseItem.status === 'Appointed' ? 'border-l-4 border-l-blue-500' : ''}`}>
              
              {/* Header */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">#{getField(caseItem, 'caseId')}</span>
                    <h3 className="font-semibold text-gray-900 dark:text-white mt-1">{getField(caseItem, 'atmName')}</h3>
                  </div>
                  <div className="flex gap-2">
                    {caseItem.status === 'Appointed' && (
                      <button
                        onClick={() => startWork(caseItem.id)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm flex items-center gap-1 transition-colors"
                        title="Start Work"
                      >
                        <Wrench size={14} />
                        Start
                      </button>
                    )}
                    {caseItem.status === 'Ongoing' && (
                      <button
                        onClick={() => completeWork(caseItem.id)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-1 transition-colors"
                        title="Complete"
                      >
                        <CheckCircle size={14} />
                        Complete
                      </button>
                    )}
                    <button
                      onClick={() => handleView(caseItem)}
                      className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(caseItem.status)}`}>
                    {caseItem.status}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(caseItem.priority)}`}>
                    {caseItem.priority || 'Medium'}
                  </span>
                </div>
              </div>
              
              {/* Details */}
              <div className="p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Building size={14} /> Bank:
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">{caseItem.bank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <MapPin size={14} /> Location:
                  </span>
                  <span className="text-gray-900 dark:text-white">{caseItem.district} / {caseItem.branch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <AlertCircle size={14} /> Case Type:
                  </span>
                  <span className="text-gray-900 dark:text-white">{getField(caseItem, 'caseType')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Calendar size={14} /> Assigned:
                  </span>
                  <span className="text-gray-900 dark:text-white">{formatDate(caseItem.updatedAt || caseItem.createdAt)}</span>
                </div>
                {caseItem.comment && (
                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Comment:</p>
                    <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">{caseItem.comment}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Case Modal */}
      {showViewModal && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Case Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Case ID</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{getField(selectedCase, 'caseId')}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={`text-sm font-semibold px-2 py-1 rounded-full inline-block mt-1 ${getStatusColor(selectedCase.status)}`}>
                    {selectedCase.status}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">ATM Name</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{getField(selectedCase, 'atmName')}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Bank</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedCase.bank}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">District</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedCase.district}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Branch</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedCase.branch}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Case Type</p>
                  <p className="text-sm text-gray-900 dark:text-white">{getField(selectedCase, 'caseType')}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Priority</p>
                  <span className={`text-sm font-semibold px-2 py-1 rounded-full inline-block mt-1 ${getPriorityColor(selectedCase.priority)}`}>
                    {selectedCase.priority || 'Medium'}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Created Date</p>
                  <p className="text-sm text-gray-900 dark:text-white">{formatDate(selectedCase.createdAt)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="text-sm text-gray-900 dark:text-white">{formatDate(selectedCase.updatedAt)}</p>
                </div>
                <div className="md:col-span-2 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Comment / Description</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{selectedCase.comment || 'No comments'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
              {selectedCase.status === 'Appointed' && (
                <button
                  onClick={() => {
                    startWork(selectedCase.id);
                    setShowViewModal(false);
                    toast.success('Work started on case ' + getField(selectedCase, 'caseId'));
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg mr-3"
                >
                  Start Work
                </button>
              )}
              {selectedCase.status === 'Ongoing' && (
                <button
                  onClick={() => {
                    completeWork(selectedCase.id);
                    setShowViewModal(false);
                    toast.success('Case ' + getField(selectedCase, 'caseId') + ' completed');
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg mr-3"
                >
                  Complete Case
                </button>
              )}
              <button onClick={() => setShowViewModal(false)} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAssignedCases;