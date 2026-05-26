import React, { useState } from 'react';
import { UserCheck, Search, User, X, Building, MapPin, AlertCircle } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useDarkMode } from '../../context/DarkModeContext';
import { useCases } from '../../context/CaseContext';

const AppointTechnician = () => {
  const { darkMode } = useDarkMode();
  const { cases, technicians, appointTechnician } = useCases();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const pendingCases = cases.filter(c => c.status === 'Pending');

  const handleAppoint = async () => {
    if (!selectedTechnician) {
      toast.error('Please select a technician');
      return;
    }
    
    console.log('Appointing technician:', {
      caseId: selectedCase.id,
      technicianId: parseInt(selectedTechnician)
    });
    
    setLoading(true);
    try {
      await appointTechnician(selectedCase.id, parseInt(selectedTechnician));
      toast.success(`Technician appointed for case ${selectedCase.caseId}`);
      setShowModal(false);
      setSelectedTechnician('');
    } catch (error) {
      console.error('Error appointing technician:', error);
      toast.error(error.message || 'Failed to appoint technician');
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = pendingCases.filter(c => {
    const caseId = c.caseId || c.case_id;
    const atmName = c.atmName || c.atm_name;
    const bank = c.bank;
    
    return (
      caseId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      atmName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bank?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'High': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
  };

  const activeTechnicians = technicians.filter(t => t.status === 'Active');

  return (
    <div className="px-3 sm:px-4 md:px-6 pb-6">
      <Toaster position="top-right" />
      
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Appoint Technician</h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">Assign technicians to pending ATM cases</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by Case ID, ATM Name, or Bank..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {activeTechnicians.length === 0 && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            ⚠️ No active technicians available. Please add technicians first.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCases.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            No pending cases found
          </div>
        ) : (
          filteredCases.map((caseItem) => (
            <div key={caseItem.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(caseItem.priority)}`}>
                    {caseItem.priority || 'Medium'}
                  </span>
                  <h3 className="font-semibold text-gray-900 dark:text-white mt-2">{caseItem.caseId || caseItem.case_id}</h3>
                </div>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                  Pending
                </span>
              </div>
              
              <div className="space-y-2 text-sm mt-4">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Building size={14} /> ATM:</span>
                  <span className="text-gray-900 dark:text-white font-medium">{caseItem.atmName || caseItem.atm_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Building size={14} /> Bank:</span>
                  <span className="text-gray-900 dark:text-white">{caseItem.bank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><MapPin size={14} /> Location:</span>
                  <span className="text-gray-900 dark:text-white">{caseItem.district} / {caseItem.branch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><AlertCircle size={14} /> Case Type:</span>
                  <span className="text-gray-900 dark:text-white">{caseItem.caseType || caseItem.case_type}</span>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setSelectedCase(caseItem);
                  setShowModal(true);
                }}
                disabled={activeTechnicians.length === 0}
                className={`w-full mt-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors
                  ${activeTechnicians.length > 0 
                    ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                    : 'bg-gray-400 cursor-not-allowed text-gray-200'
                  }`}
              >
                <UserCheck size={18} />
                Appoint Technician
              </button>
            </div>
          ))
        )}
      </div>

      {showModal && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Appoint Technician</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Case ID</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedCase.caseId || selectedCase.case_id}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">ATM Location</p>
                <p className="text-gray-900 dark:text-white">{(selectedCase.atmName || selectedCase.atm_name)} - {selectedCase.bank}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Technician</label>
                <select 
                  value={selectedTechnician} 
                  onChange={(e) => setSelectedTechnician(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={loading}
                >
                  <option value="">Choose a technician</option>
                  {activeTechnicians.map(tech => (
                    <option key={tech.id} value={tech.id}>{tech.name}</option>
                  ))}
                </select>
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
                onClick={handleAppoint} 
                disabled={loading || !selectedTechnician}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <UserCheck size={16} />
                    Confirm
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

export default AppointTechnician;