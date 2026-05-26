import React, { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Search, X, CreditCard, Building, MapPin, AlertCircle, MessageSquare, Calendar, User, Clock } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useDarkMode } from '../../context/DarkModeContext';
import { useCases } from '../../context/CaseContext';

const ManageCase = () => {
  const { darkMode } = useDarkMode();
  const { cases, addCase, updateCase, deleteCase, loading: contextLoading } = useCases();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [editingCase, setEditingCase] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    atmName: '',
    bank: '',
    district: '',
    branch: '',
    caseType: '',
    comment: '',
    priority: 'Medium'
  });

  const banks = ['Commercial Bank', 'Abyssinia Bank', 'Dashen Bank', 'Awash Bank', 'Hibret Bank', 'Zemen Bank', 'Oromia Bank'];
  const districts = ['Bole', 'Kirkos', 'Yeka', 'Gulele', 'Kolfe', 'Addis Ketema', 'Nifas Silk', 'Lideta', 'Arada'];
  const branches = ['Main Branch', 'Bole Branch', 'Mexico Branch', 'Cmc Branch', 'Piassa Branch', 'Sar Bet Branch', 'Gerji Branch', 'Ayat Branch'];
  const caseTypes = ['Card Jam', 'Out of Cash', 'Technical Error', 'Card Not Returned', 'Network Issue', 'Hardware Failure', 'Power Issue', 'Display Error', 'Printer Issue', 'Cash Dispenser Error'];
  const priorities = ['Low', 'Medium', 'High', 'Urgent'];

  // Helper to safely get field values (handles both camelCase and snake_case)
  const getField = (obj, field) => {
    if (!obj) return '';
    const camelCase = field;
    const snakeCase = field.replace(/([A-Z])/g, '_$1').toLowerCase();
    return obj[camelCase] || obj[snakeCase] || '';
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.atmName) {
      toast.error('ATM Name is required');
      return;
    }
    if (!formData.bank) {
      toast.error('Bank is required');
      return;
    }
    if (!formData.district) {
      toast.error('District is required');
      return;
    }
    if (!formData.branch) {
      toast.error('Branch is required');
      return;
    }
    if (!formData.caseType) {
      toast.error('Case Type is required');
      return;
    }

    setLoading(true);
    try {
      if (editingCase) {
        await updateCase({ ...formData, id: editingCase.id });
        toast.success('Case updated successfully');
      } else {
        await addCase(formData);
        toast.success('Case created successfully');
      }
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving case:', error);
      toast.error(error.message || 'Failed to save case');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (caseItem) => {
    setEditingCase(caseItem);
    setFormData({
      atmName: getField(caseItem, 'atmName') || '',
      bank: caseItem.bank || '',
      district: caseItem.district || '',
      branch: caseItem.branch || '',
      caseType: getField(caseItem, 'caseType') || '',
      comment: caseItem.comment || '',
      priority: caseItem.priority || 'Medium'
    });
    setShowModal(true);
  };

  const handleView = (caseItem) => {
    setSelectedCase(caseItem);
    setShowViewModal(true);
  };

  const handleDelete = async (caseItem) => {
    if (window.confirm('Are you sure you want to delete this case? This action cannot be undone.')) {
      setLoading(true);
      try {
        await deleteCase(caseItem.id);
        toast.success('Case deleted successfully');
      } catch (error) {
        console.error('Error deleting case:', error);
        toast.error(error.message || 'Failed to delete case');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      atmName: '',
      bank: '',
      district: '',
      branch: '',
      caseType: '',
      comment: '',
      priority: 'Medium'
    });
    setEditingCase(null);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Ongoing': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'Appointed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Terminated': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
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

  const filteredCases = cases.filter(c => {
    const caseId = getField(c, 'caseId');
    const atmName = getField(c, 'atmName');
    const bank = c.bank;
    
    return (
      caseId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      atmName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bank?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Debug logs
  console.log('All cases:', cases);
  console.log('Filtered cases:', filteredCases);
  console.log('Cases length:', cases.length);

  // Loading state
  if (contextLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Mobile Card Component
  const CaseCard = ({ caseItem, index }) => (
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
        <div className="flex gap-2">
          <button onClick={() => handleView(caseItem)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="View">
            <Eye size={16} />
          </button>
          <button onClick={() => handleEdit(caseItem)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
            <Edit size={16} />
          </button>
          <button onClick={() => handleDelete(caseItem)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
            <Trash2 size={16} />
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
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><AlertCircle size={14} /> Case Type:</span>
          <span className="text-gray-900 dark:text-white">{getField(caseItem, 'caseType')}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><User size={14} /> Technician:</span>
          {caseItem.technician ? (
            <span className="text-orange-600 dark:text-orange-400 font-semibold">{caseItem.technician}</span>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">Not assigned</span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Calendar size={14} /> Dates:</span>
          <span className="text-gray-900 dark:text-white text-xs">
            {caseItem.startDate ? new Date(caseItem.startDate).toLocaleDateString() : '-'} → {caseItem.endDate ? new Date(caseItem.endDate).toLocaleDateString() : '-'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Clock size={14} /> Priority:</span>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(caseItem.priority)}`}>
            {caseItem.priority || 'Medium'}
          </span>
        </div>
        {caseItem.comment && (
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1"><MessageSquare size={12} /> Comment:</p>
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
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Manage Cases</h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">Create, edit, and manage ATM cases</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            disabled={loading}
            className="bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
          >
            <Plus size={18} />
            New Case
          </button>
        </div>
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-325">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case ID</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ATM Name</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case Type</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technician</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan="13" className="px-4 py-12 text-center text-gray-500">
                    No cases found
                  </td>
                </tr>
              ) : (
                filteredCases.map((caseItem, index) => (
                  <tr key={caseItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-3 py-3 text-sm text-gray-600">{index + 1}</td>
                    <td className="px-3 py-3 text-sm font-semibold text-gray-900">{getField(caseItem, 'caseId')}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">{caseItem.bank || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">{caseItem.district || '-'}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">{caseItem.branch || '-'}</td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-800">{getField(caseItem, 'atmName')}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">{getField(caseItem, 'caseType')}</td>
                    <td className="px-3 py-3 text-sm text-gray-500 max-w-xs truncate">{caseItem.comment || '-'}</td>
                    <td className="px-3 py-3 text-sm">
                      {caseItem.technician ? (
                        <span className="text-orange-600 font-semibold">{caseItem.technician}</span>
                      ) : (
                        <span className="text-gray-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">
                      {caseItem.startDate ? new Date(caseItem.startDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">
                      {caseItem.endDate ? new Date(caseItem.endDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(caseItem.status)}`}>
                        {caseItem.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleView(caseItem)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="View">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => handleEdit(caseItem)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(caseItem)} disabled={loading} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50" title="Delete">
                          <Trash2 size={16} />
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
          filteredCases.map((caseItem, index) => (
            <CaseCard key={caseItem.id} caseItem={caseItem} index={index} />
          ))
        )}
      </div>

      {/* Add/Edit Case Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingCase ? 'Edit Case' : 'Create New Case'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Form fields - same as before */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ATM Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <CreditCard size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      value={formData.atmName} 
                      onChange={(e) => setFormData({...formData, atmName: e.target.value})} 
                      placeholder="Enter ATM name"
                      className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bank <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select 
                      value={formData.bank} 
                      onChange={(e) => setFormData({...formData, bank: e.target.value})} 
                      className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Bank</option>
                      {banks.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    District <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select 
                      value={formData.district} 
                      onChange={(e) => setFormData({...formData, district: e.target.value})} 
                      className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select District</option>
                      {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Branch <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select 
                      value={formData.branch} 
                      onChange={(e) => setFormData({...formData, branch: e.target.value})} 
                      className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Branch</option>
                      {branches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Case Type <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <AlertCircle size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select 
                      value={formData.caseType} 
                      onChange={(e) => setFormData({...formData, caseType: e.target.value})} 
                      className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Case Type</option>
                      {caseTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select 
                    value={formData.priority} 
                    onChange={(e) => setFormData({...formData, priority: e.target.value})} 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Comment / Description
                  </label>
                  <div className="relative">
                    <MessageSquare size={18} className="absolute left-3 top-3 text-gray-400" />
                    <textarea 
                      rows="4" 
                      value={formData.comment} 
                      onChange={(e) => setFormData({...formData, comment: e.target.value})} 
                      className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                      placeholder="Describe the issue in detail..."
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={loading}
                className="px-4 py-2 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  editingCase ? 'Update Case' : 'Create Case'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <p className="text-sm font-semibold text-gray-900">{getField(selectedCase, 'caseId')}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={`text-sm font-semibold px-2 py-1 rounded-full inline-block mt-1 ${getStatusColor(selectedCase.status)}`}>
                    {selectedCase.status}
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
                  <p className="text-xs text-gray-500">Priority</p>
                  <span className={`text-sm font-semibold px-2 py-1 rounded-full inline-block mt-1 ${getPriorityColor(selectedCase.priority)}`}>
                    {selectedCase.priority}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Technician</p>
                  <p className="text-sm text-orange-600 font-semibold">{selectedCase.technician || 'Not assigned'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Created Date</p>
                  <p className="text-sm text-gray-900">{selectedCase.createdAt || selectedCase.created_at}</p>
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

export default ManageCase;