import React, { useState } from 'react';
import { 
  XCircle,
  Search,
  AlertTriangle,
  User,
  Trash2,
  MapPin,
  Building,
  AlertCircle,
  Clock
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useDarkMode } from '../../context/DarkModeContext';
import { useCases } from '../../context/CaseContext';

const TerminateCase = () => {
  const { darkMode } = useDarkMode();
  const { cases, terminateCase, loading: contextLoading } = useCases();
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Helper to get field values (handles both camelCase and snake_case)
  const getField = (obj, field) => {
    if (!obj) return '';
    const camelCase = field;
    const snakeCase = field.replace(/([A-Z])/g, '_$1').toLowerCase();
    return obj[camelCase] || obj[snakeCase] || '';
  };

  // Filter active cases (not terminated or completed)
  const activeCases = cases.filter(c => 
    c.status !== 'Terminated' && 
    c.status !== 'Completed' &&
    (c.status === 'Ongoing' || c.status === 'Appointed' || c.status === 'Pending')
  );

  const handleTerminate = async () => {
    if (!terminationReason) {
      toast.error('Please provide a reason for termination');
      return;
    }
    
    setLoading(true);
    try {
      await terminateCase(selectedCase.id, terminationReason);
      toast.success(`Case ${getField(selectedCase, 'caseId')} has been terminated`);
      setShowModal(false);
      setTerminationReason('');
    } catch (error) {
      console.error('Error terminating case:', error);
      toast.error(error.message || 'Failed to terminate case');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Ongoing': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'Appointed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Terminated': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
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

  const filteredCases = activeCases.filter(c => {
    const caseId = getField(c, 'caseId');
    const atmName = getField(c, 'atmName');
    const bank = c.bank;
    
    return (
      caseId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      atmName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bank?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Loading state
  if (contextLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Mobile Card Component
  const CaseCard = ({ caseItem }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">#{getField(caseItem, 'caseId')}</span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(caseItem.status)}`}>
              {caseItem.status}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{getField(caseItem, 'atmName')}</h3>
        </div>
        <button
          onClick={() => {
            setSelectedCase(caseItem);
            setShowModal(true);
          }}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 text-sm"
        >
          <XCircle size={14} />
          Terminate
        </button>
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
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><AlertCircle size={14} /> Case Type:</span>
          <span className="text-gray-900 dark:text-white">{getField(caseItem, 'caseType')}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Clock size={14} /> Priority:</span>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(caseItem.priority)}`}>
            {caseItem.priority || 'Medium'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><User size={14} /> Technician:</span>
          <span className="text-gray-900 dark:text-white">{caseItem.technician || 'Not assigned'}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="px-3 sm:px-4 md:px-6 pb-6">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <XCircle size={28} className="text-red-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Terminate Case</h1>
        </div>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Terminate active ATM cases with reason</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by Case ID, ATM Name, or Bank..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ATM/Bank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technician</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                    No active cases found
                  </td>
                </tr>
              ) : (
                filteredCases.map((caseItem) => (
                  <tr key={caseItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{getField(caseItem, 'caseId')}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{getField(caseItem, 'atmName')}</p>
                        <p className="text-xs text-gray-500">{caseItem.bank}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {caseItem.district} / {caseItem.branch}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{getField(caseItem, 'caseType')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(caseItem.priority)}`}>
                        {caseItem.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(caseItem.status)}`}>
                        {caseItem.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-600">{caseItem.technician || 'Not assigned'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedCase(caseItem);
                          setShowModal(true);
                        }}
                        disabled={loading}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors text-sm disabled:opacity-50"
                      >
                        <XCircle size={16} />
                        Terminate
                      </button>
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
            No active cases found
          </div>
        ) : (
          filteredCases.map((caseItem) => (
            <CaseCard key={caseItem.id} caseItem={caseItem} />
          ))
        )}
      </div>

      {/* Termination Modal */}
      {showModal && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-red-600" size={24} />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Terminate Case</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                disabled={loading}
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-400 font-medium">Warning: This action cannot be undone</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">Terminating a case will close it immediately</p>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Case Details</p>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Case ID:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{getField(selectedCase, 'caseId')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">ATM:</span>
                    <span className="text-sm text-gray-900 dark:text-white">{getField(selectedCase, 'atmName')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Bank:</span>
                    <span className="text-sm text-gray-900 dark:text-white">{selectedCase.bank}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Technician:</span>
                    <span className="text-sm text-gray-900 dark:text-white">{selectedCase.technician || 'Not assigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Current Status:</span>
                    <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getStatusColor(selectedCase.status)}`}>
                      {selectedCase.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Termination <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={terminationReason}
                  onChange={(e) => setTerminationReason(e.target.value)}
                  rows="3"
                  placeholder="Please provide a reason for terminating this case..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleTerminate}
                disabled={loading || !terminationReason}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Confirm Termination
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TerminateCase;