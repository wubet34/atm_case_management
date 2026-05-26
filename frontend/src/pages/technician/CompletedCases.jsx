import React, { useState } from 'react';
import { Search, Eye, CheckCircle, Calendar, MapPin, Building, Clock, CreditCard } from 'lucide-react';
import { useDarkMode } from '../../context/DarkModeContext';
import { useAuth } from '../../context/AuthContext';
import { useCases } from '../../context/CaseContext';

const CompletedCases = () => {
  const { darkMode } = useDarkMode();
  const { user } = useAuth();
  const { cases, loading } = useCases();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

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

  const completedCases = cases.filter(c => 
    c.technician === user?.name && c.status === 'Completed'
  );

  const filteredCases = completedCases.filter(c => {
    const caseId = getField(c, 'caseId');
    const atmName = getField(c, 'atmName');
    return (
      caseId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      atmName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleView = (caseItem) => {
    setSelectedCase(caseItem);
    setShowViewModal(true);
  };

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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} className="text-green-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">#{getField(caseItem, 'caseId')}</span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{getField(caseItem, 'atmName')}</h3>
        </div>
        <button
          onClick={() => handleView(caseItem)}
          className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="View Details"
        >
          <Eye size={16} />
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Building size={14} /> Bank:</span>
          <span className="text-gray-900 dark:text-white font-medium">{caseItem.bank || '-'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><MapPin size={14} /> District:</span>
          <span className="text-gray-900 dark:text-white">{caseItem.district || '-'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><CreditCard size={14} /> Case Type:</span>
          <span className="text-gray-900 dark:text-white">{getField(caseItem, 'caseType')}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Calendar size={14} /> Completed:</span>
          <span className="text-gray-900 dark:text-white">{formatDate(caseItem.completedAt || caseItem.end_date)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="px-3 sm:px-4 md:px-6 pb-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Completed Cases</h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
          History of your completed cases
        </p>
      </div>

      {/* Stats Card */}
      <div className="bg-linear-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 mb-6 border border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-green-600 dark:text-green-400">Total Completed Cases</p>
            <p className="text-3xl font-bold text-green-700 dark:text-green-300">{completedCases.length}</p>
          </div>
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle size={24} className="text-white" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by Case ID or ATM Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Cases List - Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCases.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            <CheckCircle size={48} className="mx-auto mb-3 opacity-50" />
            <p>No completed cases yet</p>
            <p className="text-sm mt-1">Your completed cases will appear here</p>
          </div>
        ) : (
          filteredCases.map((caseItem) => (
            <div key={caseItem.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200">
              {/* Header with Case ID and Status */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle size={14} className="text-green-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">#{getField(caseItem, 'caseId')}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{getField(caseItem, 'atmName')}</h3>
                </div>
                <button
                  onClick={() => handleView(caseItem)}
                  className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="View Details"
                >
                  <Eye size={16} />
                </button>
              </div>
              
              {/* Case Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Building size={14} /> Bank:
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">{caseItem.bank || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <MapPin size={14} /> District:
                  </span>
                  <span className="text-gray-900 dark:text-white">{caseItem.district || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <CreditCard size={14} /> Case Type:
                  </span>
                  <span className="text-gray-900 dark:text-white">{getField(caseItem, 'caseType')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Calendar size={14} /> Completed:
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatDate(caseItem.completedAt || caseItem.end_date || caseItem.updatedAt)}
                  </span>
                </div>
              </div>
              
              {/* Footer with branch info */}
              {caseItem.branch && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <MapPin size={10} />
                    {caseItem.branch} Branch
                  </p>
                </div>
              )}
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
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Case ID</p>
                  <p className="text-sm font-semibold text-gray-900">{getField(selectedCase, 'caseId')}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Status</p>
                  <span className="text-sm font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800">
                    Completed
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">ATM Name</p>
                  <p className="text-sm font-medium text-gray-900">{getField(selectedCase, 'atmName')}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Bank</p>
                  <p className="text-sm text-gray-900">{selectedCase.bank}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">District</p>
                  <p className="text-sm text-gray-900">{selectedCase.district}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Branch</p>
                  <p className="text-sm text-gray-900">{selectedCase.branch}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Case Type</p>
                  <p className="text-sm text-gray-900">{getField(selectedCase, 'caseType')}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Completed Date</p>
                  <p className="text-sm text-gray-900">{formatDate(selectedCase.completedAt || selectedCase.end_date)}</p>
                </div>
                <div className="md:col-span-2 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Comment</p>
                  <p className="text-sm text-gray-700 mt-1">{selectedCase.comment || 'No comments'}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
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

export default CompletedCases;