import React, { useState, useEffect } from 'react';
import {
    FileText, Download, Printer, Send, Eye, Trash2, X, CheckCircle
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useDarkMode } from '../context/DarkModeContext';
import { useAuth } from '../context/AuthContext';
import { reportService } from '../services/reportService';

const Reports = () => {
    const { darkMode } = useDarkMode();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [reportsLoading, setReportsLoading] = useState(false);
    
    // Technician Report States
    const [techReports, setTechReports] = useState([]);
    const [reportStats, setReportStats] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportForm, setReportForm] = useState({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [viewingReport, setViewingReport] = useState(null);

    const isAdmin = user?.role === 'admin';
    const isTechnician = user?.role === 'technician';

    // Load technician reports from backend API
    useEffect(() => {
        if (user) {
            loadReports();
            if (isAdmin) {
                loadReportStats();
            }
        }
    }, [user]);

    const loadReports = async () => {
        setReportsLoading(true);
        try {
            let response;
            if (isAdmin) {
                response = await reportService.getAllReports({});
            } else if (isTechnician) {
                response = await reportService.getMyReports({});
            }
            
            if (response?.success) {
                setTechReports(response.data);
            } else {
                setTechReports([]);
            }
        } catch (error) {
            console.error('Error loading reports:', error);
            toast.error('Failed to load reports: ' + (error.message || 'Unknown error'));
            setTechReports([]);
        } finally {
            setReportsLoading(false);
        }
    };

    const loadReportStats = async () => {
        try {
            const response = await reportService.getReportStats();
            if (response?.success) {
                setReportStats(response.stats);
            }
        } catch (error) {
            console.error('Error loading report stats:', error);
        }
    };

    const handleSubmitReport = async () => {
        if (!reportForm.title.trim()) {
            toast.error('Please enter a report title');
            return;
        }
        if (!reportForm.description.trim()) {
            toast.error('Please enter report description');
            return;
        }

        setLoading(true);
        try {
            const response = await reportService.createReport({
                title: reportForm.title,
                description: reportForm.description,
                report_date: reportForm.date
            });
            
            if (response.success) {
                toast.success('Report submitted successfully');
                setShowReportModal(false);
                setReportForm({
                    title: '',
                    description: '',
                    date: new Date().toISOString().split('T')[0]
                });
                await loadReports();
                if (isAdmin) {
                    await loadReportStats();
                }
            } else {
                toast.error(response.message || 'Failed to submit report');
            }
        } catch (error) {
            console.error('Submit report error:', error);
            toast.error(error.message || 'Failed to submit report');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReport = async (reportId) => {
        if (!window.confirm('Are you sure you want to delete this report?')) return;
        
        setLoading(true);
        try {
            const response = await reportService.deleteReport(reportId);
            if (response.success) {
                toast.success('Report deleted successfully');
                await loadReports();
                if (isAdmin) {
                    await loadReportStats();
                }
            } else {
                toast.error(response.message || 'Failed to delete report');
            }
        } catch (error) {
            console.error('Delete report error:', error);
            toast.error(error.message || 'Failed to delete report');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsReviewed = async (reportId) => {
        setLoading(true);
        try {
            const response = await reportService.updateReportStatus(reportId, 'reviewed');
            if (response.success) {
                toast.success('Report marked as reviewed');
                await loadReports();
                await loadReportStats();
            } else {
                toast.error(response.message || 'Failed to update report status');
            }
        } catch (error) {
            console.error('Update status error:', error);
            toast.error(error.message || 'Failed to update report status');
        } finally {
            setLoading(false);
        }
    };

    const handleExportReports = async () => {
        if (techReports.length === 0) {
            toast.error('No reports to export');
            return;
        }
        
        setLoading(true);
        try {
            await reportService.exportReports('json', {});
            toast.success('Reports exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export reports');
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = async () => {
        if (techReports.length === 0) {
            toast.error('No reports to export');
            return;
        }
        
        setLoading(true);
        try {
            await reportService.exportReports('csv', {});
            toast.success('Reports exported as CSV');
        } catch (error) {
            console.error('Export CSV error:', error);
            toast.error('Failed to export reports as CSV');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">{title}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
                <div className={`${bgColor} p-2 rounded-xl`}>
                    <Icon size={18} className={color} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="px-4 pb-6 print:px-0">
            <Toaster position="top-right" />
            
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {isAdmin ? 'Manage technician reports' : 'Submit and manage your reports'}
                        </p>
                    </div>
                    <div className="flex gap-2 print:hidden w-full sm:w-auto">
                        {isTechnician && (
                            <button
                                onClick={() => setShowReportModal(true)}
                                disabled={loading}
                                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-sm"
                            >
                                <Send size={16} />
                                Submit
                            </button>
                        )}
                        {techReports.length > 0 && (
                            <>
                                <button
                                    onClick={handleExportCSV}
                                    disabled={loading || reportsLoading}
                                    className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-sm"
                                >
                                    <Download size={14} />
                                    CSV
                                </button>
                                <button
                                    onClick={handleExportReports}
                                    disabled={loading || reportsLoading}
                                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-sm"
                                >
                                    <Download size={14} />
                                    JSON
                                </button>
                            </>
                        )}
                        <button
                            onClick={handlePrint}
                            className="flex-1 sm:flex-none bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                        >
                            <Printer size={16} />
                            Print
                        </button>
                    </div>
                </div>
            </div>

            {/* Admin Stats Summary */}
            {isAdmin && reportStats && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <StatCard
                        title="Total Reports"
                        value={reportStats.total_reports || 0}
                        icon={FileText}
                        color="text-orange-600 dark:text-orange-400"
                        bgColor="bg-orange-50 dark:bg-orange-900/20"
                    />
                    <StatCard
                        title="Pending Review"
                        value={reportStats.pending_reports || 0}
                        icon={FileText}
                        color="text-yellow-600 dark:text-yellow-400"
                        bgColor="bg-yellow-50 dark:bg-yellow-900/20"
                    />
                    <StatCard
                        title="Reviewed"
                        value={reportStats.reviewed_reports || 0}
                        icon={CheckCircle}
                        color="text-green-600 dark:text-green-400"
                        bgColor="bg-green-50 dark:bg-green-900/20"
                    />
                    <StatCard
                        title="Active Techs"
                        value={reportStats.unique_technicians || 0}
                        icon={FileText}
                        color="text-purple-600 dark:text-purple-400"
                        bgColor="bg-purple-50 dark:bg-purple-900/20"
                    />
                </div>
            )}

            {/* Technician Reports Section */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {isAdmin ? 'All Technician Reports' : 'My Reports'}
                </h2>
                
                {reportsLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                ) : techReports.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center border border-gray-100 dark:border-gray-700">
                        <FileText size={48} className="mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 mb-3">
                            {isTechnician ? "You haven't submitted any reports yet" : "No reports found"}
                        </p>
                        {isTechnician && (
                            <button
                                onClick={() => setShowReportModal(true)}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
                            >
                                <Send size={16} />
                                Submit Your First Report
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {techReports.map((report) => (
                            <div key={report.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{report.title}</h3>
                                            <span className={`px-2 py-0.5 text-xs rounded-full shrink-0 ${
                                                report.status === 'pending' 
                                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                                    : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                            }`}>
                                                {report.status === 'pending' ? 'Pending' : 'Reviewed'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {isAdmin && `By: ${report.technician_name} | `}
                                            {new Date(report.report_date || report.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-1 ml-2">
                                        <button
                                            onClick={() => setViewingReport(report)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                        >
                                            <Eye size={14} />
                                        </button>
                                        {isAdmin && report.status === 'pending' && (
                                            <button
                                                onClick={() => handleMarkAsReviewed(report.id)}
                                                disabled={loading}
                                                className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                                            >
                                                <CheckCircle size={14} />
                                            </button>
                                        )}
                                        {(isAdmin || report.technician_id === user?.id) && (
                                            <button
                                                onClick={() => handleDeleteReport(report.id)}
                                                disabled={loading}
                                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 break-words">
                                    {report.description}
                                </p>
                                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <p className="text-xs text-gray-400 break-words">
                                        Submitted: {new Date(report.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Submit Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`max-w-lg w-full rounded-xl shadow-xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className={`flex justify-between items-center p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Submit New Report</h2>
                            <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Report Title *</label>
                                <input
                                    type="text"
                                    value={reportForm.title}
                                    onChange={(e) => setReportForm({...reportForm, title: e.target.value})}
                                    placeholder="Enter report title"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Report Date</label>
                                <input
                                    type="date"
                                    value={reportForm.date}
                                    onChange={(e) => setReportForm({...reportForm, date: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                                <textarea
                                    value={reportForm.description}
                                    onChange={(e) => setReportForm({...reportForm, description: e.target.value})}
                                    rows="4"
                                    placeholder="Describe the issue or report details..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className={`flex justify-end gap-2 p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitReport}
                                disabled={loading}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 text-sm"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                    <Send size={14} />
                                )}
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Report Modal */}
            {viewingReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`max-w-lg w-full max-h-[80vh] overflow-y-auto rounded-xl shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className={`sticky top-0 flex justify-between items-center p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'} bg-inherit`}>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Report Details</h2>
                            <button onClick={() => setViewingReport(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-4 space-y-3">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Title</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white break-words">{viewingReport.title}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Submitted By</p>
                                <p className="text-sm text-gray-900 dark:text-white break-words">{viewingReport.technician_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Report Date</p>
                                <p className="text-sm text-gray-900 dark:text-white">{new Date(viewingReport.report_date || viewingReport.date).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                                <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                                    viewingReport.status === 'pending' 
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-green-100 text-green-800'
                                }`}>
                                    {viewingReport.status === 'pending' ? 'Pending Review' : 'Reviewed'}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Description</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap break-words">{viewingReport.description}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Submitted At</p>
                                <p className="text-sm text-gray-900 dark:text-white">{new Date(viewingReport.created_at).toLocaleString()}</p>
                            </div>
                        </div>
                        
                        <div className={`sticky bottom-0 flex justify-end p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'} bg-inherit`}>
                            <button
                                onClick={() => setViewingReport(null)}
                                className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;