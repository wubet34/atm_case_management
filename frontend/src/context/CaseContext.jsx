import React, { createContext, useContext, useState, useEffect } from 'react';
import { caseAPI, technicianAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

const CaseContext = createContext();

export const useCases = () => {
  const context = useContext(CaseContext);
  if (!context) {
    throw new Error('useCases must be used within CaseProvider');
  }
  return context;
};

export const CaseProvider = ({ children }) => {
  const [cases, setCases] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const mapCaseData = (backendCase) => ({
    id: backendCase.id,
    caseId: backendCase.case_id,
    atmName: backendCase.atm_name,
    bank: backendCase.bank,
    district: backendCase.district,
    branch: backendCase.branch,
    caseType: backendCase.case_type,
    comment: backendCase.comment,
    priority: backendCase.priority,
    status: backendCase.status,
    technician: backendCase.technician,
    technicianId: backendCase.technician_id,
    startDate: backendCase.start_date,
    endDate: backendCase.end_date,
    completedAt: backendCase.completed_at,
    terminatedAt: backendCase.terminated_at,
    terminationReason: backendCase.termination_reason,
    createdBy: backendCase.created_by,
    createdAt: backendCase.created_at,
    updatedAt: backendCase.updated_at
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const casesResponse = await caseAPI.getAll();
      if (casesResponse.success) {
        const mappedCases = casesResponse.data.map(mapCaseData);
        setCases(mappedCases);
      }
      
      if (user?.role === 'admin') {
        const techResponse = await technicianAPI.getAll();
        if (techResponse.success) {
          setTechnicians(techResponse.data);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const refreshCases = async () => {
    try {
      const response = await caseAPI.getAll();
      if (response.success) {
        const mappedCases = response.data.map(mapCaseData);
        setCases(mappedCases);
      }
    } catch (error) {
      console.error('Error refreshing cases:', error);
    }
  };

  const addCase = async (newCase) => {
    setActionLoading(true);
    try {
      const response = await caseAPI.create(newCase);
      if (response.success) {
        const mappedCase = mapCaseData(response.data);
        setCases(prev => [mappedCase, ...prev]);
        
        addNotification({
          type: 'case_created',
          title: 'New Case Created',
          message: `New case ${response.data.case_id} has been created at ${response.data.atm_name}`,
          caseId: response.data.id
        });
        
        return mappedCase;
      }
      throw new Error('Failed to create case');
    } catch (error) {
      console.error('Error adding case:', error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const updateCase = async (updatedCase) => {
    setActionLoading(true);
    try {
      const backendData = {
        atmName: updatedCase.atmName,
        bank: updatedCase.bank,
        district: updatedCase.district,
        branch: updatedCase.branch,
        caseType: updatedCase.caseType,
        comment: updatedCase.comment,
        priority: updatedCase.priority
      };
      
      const response = await caseAPI.update(updatedCase.id, backendData);
      if (response.success) {
        const mappedCase = mapCaseData(response.data);
        setCases(prev => prev.map(c => c.id === updatedCase.id ? mappedCase : c));
        return mappedCase;
      }
      throw new Error('Failed to update case');
    } catch (error) {
      console.error('Error updating case:', error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const deleteCase = async (caseId) => {
    setActionLoading(true);
    try {
      await caseAPI.delete(caseId);
      setCases(prev => prev.filter(c => c.id !== caseId));
    } catch (error) {
      console.error('Error deleting case:', error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const appointTechnician = async (caseId, technicianId) => {
    setActionLoading(true);
    try {
      console.log('Appointing technician - Case ID:', caseId, 'Technician ID:', technicianId);
      
      const response = await caseAPI.appointTechnician(caseId, technicianId);
      console.log('Appoint response:', response);
      
      if (response.success) {
        const mappedCase = mapCaseData(response.data);
        setCases(prev => prev.map(c => c.id === caseId ? mappedCase : c));
        
        const technician = technicians.find(t => t.id === technicianId);
        
        addNotification({
          type: 'case_appointed',
          title: 'Technician Appointed',
          message: `${technician?.name || 'Technician'} appointed for case ${response.data.case_id}`,
          caseId: caseId
        });
        
        return mappedCase;
      } else {
        throw new Error(response.message || 'Failed to appoint technician');
      }
    } catch (error) {
      console.error('Error appointing technician:', error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const startWork = async (caseId) => {
    setActionLoading(true);
    try {
      const response = await caseAPI.startWork(caseId);
      if (response.success) {
        const mappedCase = mapCaseData(response.data);
        setCases(prev => prev.map(c => c.id === caseId ? mappedCase : c));
        
        addNotification({
          type: 'case_started',
          title: 'Work Started',
          message: `Work has started on case ${response.data.case_id}`,
          caseId: caseId
        });
        
        return mappedCase;
      }
      throw new Error('Failed to start work');
    } catch (error) {
      console.error('Error starting work:', error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const completeWork = async (caseId) => {
    setActionLoading(true);
    try {
      const response = await caseAPI.completeWork(caseId);
      if (response.success) {
        const mappedCase = mapCaseData(response.data);
        setCases(prev => prev.map(c => c.id === caseId ? mappedCase : c));
        
        addNotification({
          type: 'case_completed',
          title: 'Case Completed',
          message: `Case ${response.data.case_id} has been completed`,
          caseId: caseId
        });
        
        return mappedCase;
      }
      throw new Error('Failed to complete work');
    } catch (error) {
      console.error('Error completing work:', error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const terminateCase = async (caseId, reason) => {
    setActionLoading(true);
    try {
      const response = await caseAPI.terminateCase(caseId, reason);
      if (response.success) {
        const mappedCase = mapCaseData(response.data);
        setCases(prev => prev.map(c => c.id === caseId ? mappedCase : c));
        
        addNotification({
          type: 'case_terminated',
          title: 'Case Terminated',
          message: `Case ${response.data.case_id} has been terminated. Reason: ${reason}`,
          caseId: caseId
        });
        
        return mappedCase;
      }
      throw new Error('Failed to terminate case');
    } catch (error) {
      console.error('Error terminating case:', error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const refreshTechnicians = async () => {
    try {
      const response = await technicianAPI.getAll();
      if (response.success) {
        setTechnicians(response.data);
      }
    } catch (error) {
      console.error('Error refreshing technicians:', error);
    }
  };

  const getCaseById = (caseId) => {
    return cases.find(c => c.id === parseInt(caseId));
  };

  const getCasesByStatus = (status) => {
    return cases.filter(c => c.status === status);
  };

  const getCasesByTechnician = (technicianId) => {
    return cases.filter(c => c.technician_id === technicianId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return '-';
    }
  };

  return (
    <CaseContext.Provider value={{
      cases,
      technicians,
      loading,
      actionLoading,
      addCase,
      updateCase,
      deleteCase,
      appointTechnician,
      startWork,
      completeWork,
      terminateCase,
      refreshTechnicians,
      refreshCases,
      getCaseById,
      getCasesByStatus,
      getCasesByTechnician,
      formatDate
    }}>
      {children}
    </CaseContext.Provider>
  );
};