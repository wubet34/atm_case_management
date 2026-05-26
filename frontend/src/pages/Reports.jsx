import React, { useState, useEffect } from 'react';
import {
    FileText, Download, Calendar, TrendingUp, Users, Clock,
    CheckCircle, AlertCircle, Printer, BarChart3, Banknote,
    MapPin, Wrench, Send, Eye, Trash2, X, RefreshCw
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useDarkMode } from '../context/DarkModeContext';
import { useAuth } from '../context/AuthContext';
import { useCases } from '../context/CaseContext';
import { reportService } from '../services/reportService';

const Reports = () => {
    const { darkMode } = useDarkMode();
    const { user } = useAuth();
    const { cases, loading: casesLoading } = useCases();
    const [loading, setLoading] = useState(false);
    const [reportsLoading, setReportsLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [reportType, setReportType] = useState('cases');
    
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
    const [reportFilters, setReportFilters] = useState({
        status: 'all',
        startDate: '',
        endDate: ''
    });

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
    }, [user, reportFilters]);

    const loadReports = async () => {
        setReportsLoading(true);
        try {
            let response;
            if (isAdmin) {
                // Admin sees all reports
                response = await reportService.getAllReports({
                    status: reportFilters.status !== 'all' ? reportFilters.status : undefined,
                    startDate: reportFilters.startDate || undefined,
                    endDate: reportFilters.endDate || undefined
                });
            } else if (isTechnician) {
                // Technician sees only their reports
                response = await reportService.getMyReports({
                    status: reportFilters.status !== 'all' ? reportFilters.status : undefined,
                    startDate: reportFilters.startDate || undefined,
                    endDate: reportFilters.endDate || undefined
                });
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

    const getField = (obj, field) => {
        if (!obj) return '';
        const camelCase = field;
        const snakeCase = field.replace(/([A-Z])/g, '_$1').toLowerCase();
        return obj[camelCase] || obj[snakeCase] || '';
    };

    const filteredCases = cases.filter(c => {
        const createdAt = c.createdAt || c.created_at;
        return createdAt && createdAt >= dateRange.start && createdAt <= dateRange.end;
    });

    const technicianCases = filteredCases.filter(c => 
        isTechnician && c.technician === user?.name
    );

    const displayCases = isAdmin ? filteredCases : technicianCases;

    const stats = {
        totalCases: displayCases.length,
        pendingCases: displayCases.filter(c => c.status === 'Pending').length,
        ongoingCases: displayCases.filter(c => c.status === 'Ongoing').length,
        completedCases: displayCases.filter(c => c.status === 'Completed').length,
        terminatedCases: displayCases.filter(c => c.status === 'Terminated').length,
        completionRate: displayCases.length > 0 
            ? ((displayCases.filter(c => c.status === 'Completed').length / displayCases.length) * 100).toFixed(1)
            : 0
    };

    const bankReport = () => {
        const banks = {};
        displayCases.forEach(c => {
            if (c.bank) {
                if (!banks[c.bank]) {
                    banks[c.bank] = { total: 0, completed: 0, pending: 0 };
                }
                banks[c.bank].total++;
                if (c.status === 'Completed') banks[c.bank].completed++;
                if (c.status === 'Pending') banks[c.bank].pending++;
            }
        });
        return banks;
    };

    const districtReport = () => {
        const districts = {};
        displayCases.forEach(c => {
            if (c.district) {
                if (!districts[c.district]) {
                    districts[c.district] = { total: 0, completed: 0 };
                }
                districts[c.district].total++;
                if (c.status === 'Completed') districts[c.district].completed++;
            }
        });
        return districts;
    };

    const problemReport = () => {
        const problems = {};
        displayCases.forEach(c => {
            const caseType = getField(c, 'caseType');
            if (caseType) {
                if (!problems[caseType]) {
                    problems[caseType] = { total: 0, resolved: 0 };
                }
                problems[caseType].total++;
                if (c.status === 'Completed') problems[caseType].resolved++;
            }
        });
        return problems;
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
                // Reload reports
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
            await reportService.exportReports('json', {
                status: reportFilters.status !== 'all' ? reportFilters.status : undefined,
                startDate: reportFilters.startDate || undefined,
                endDate: reportFilters.endDate || undefined
            });
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
            await reportService.exportReports('csv', {
                status: reportFilters.status !== 'all' ? reportFilters.status : undefined,
                startDate: reportFilters.startDate || undefined,
                endDate: reportFilters.endDate || undefined
            });
            toast.success('Reports exported as CSV');
        } catch (error) {
            console.error('Export CSV error:', error);
            toast.error('Failed to export reports as CSV');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        setLoading(true);
        try {
            const data = {
                reportType,
                dateRange,
                stats,
                bankData: bankReport(),
                districtData: districtReport(),
                problemData: problemReport(),
                cases: displayCases.map(c => ({
                    id: c.id,
                    caseId: getField(c, 'caseId'),
                    atmName: getField(c, 'atmName'),
                    bank: c.bank,
                    district: c.district,
                    branch: c.branch,
                    caseType: getField(c, 'caseType'),
                    status: c.status,
                    priority: c.priority,
                    technician: c.technician,
                    createdAt: c.createdAt || c.created_at,
                    completedAt: c.completedAt || c.completed_at
                })),
                generatedAt: new Date().toISOString(),
                generatedBy: user?.name
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Report exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export report');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
                <div className={`${bgColor} p-3 rounded-xl`}>
                    <Icon size={24} className={color} />
                </div>
            </div>
        </div>
    );

    if (casesLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="px-3 sm:px-4 md:px-6 pb-6 print:px-0">
            <Toaster position="top-right" />
            
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Reports Dashboard</h1>
                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
                            {isAdmin ? 'Complete analytics and technician reports' : 'Your case performance and report submissions'}
                        </p>
                    </div>
                    <div className="flex gap-2 print:hidden">
                        {isTechnician && (
                            <button
                                onClick={() => setShowReportModal(true)}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                <Send size={18} />
                                Submit Report
                            </button>
                        )}
                        <button
                            onClick={handleExport}
                            disabled={loading || displayCases.length === 0}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                <Download size={18} />
                            )}
                            Export Cases
                        </button>
                        <button
                            onClick={handlePrint}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Printer size={18} />
                            Print
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Filters */}
            <div className="print:hidden bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status Filter</label>
                        <select
                            value={reportFilters.status}
                            onChange={(e) => setReportFilters({...reportFilters, status: e.target.value})}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="all">All Reports</option>
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                        <input
                            type="date"
                            value={reportFilters.startDate}
                            onChange={(e) => setReportFilters({...reportFilters, startDate: e.target.value})}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
                        <input
                            type="date"
                            value={reportFilters.endDate}
                            onChange={(e) => setReportFilters({...reportFilters, endDate: e.target.value})}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Case Report Type</label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="cases">Case Summary Report</option>
                            <option value="banks">Bank-wise Report</option>
                            <option value="districts">District-wise Report</option>
                            <option value="problems">Problem Type Report</option>
                        </select>
                    </div>
                    <div>
                        <button
                            onClick={loadReports}
                            disabled={reportsLoading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                        >
                            <RefreshCw size={16} className={reportsLoading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Admin Stats Summary */}
            {isAdmin && reportStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
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
                        icon={Clock}
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
                        title="Active Technicians"
                        value={reportStats.unique_technicians || 0}
                        icon={Users}
                        color="text-purple-600 dark:text-purple-400"
                        bgColor="bg-purple-50 dark:bg-purple-900/20"
                    />
                </div>
            )}

            {/* Statistics Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                <StatCard
                    title="Total Cases"
                    value={stats.totalCases}
                    icon={FileText}
                    color="text-orange-600 dark:text-orange-400"
                    bgColor="bg-orange-50 dark:bg-orange-900/20"
                />
                <StatCard
                    title="Pending"
                    value={stats.pendingCases}
                    icon={Clock}
                    color="text-yellow-600 dark:text-yellow-400"
                    bgColor="bg-yellow-50 dark:bg-yellow-900/20"
                />
                <StatCard
                    title="Ongoing"
                    value={stats.ongoingCases}
                    icon={TrendingUp}
                    color="text-blue-600 dark:text-blue-400"
                    bgColor="bg-blue-50 dark:bg-blue-900/20"
                />
                <StatCard
                    title="Completed"
                    value={stats.completedCases}
                    icon={CheckCircle}
                    color="text-green-600 dark:text-green-400"
                    bgColor="bg-green-50 dark:bg-green-900/20"
                />
                <StatCard
                    title="Completion Rate"
                    value={`${stats.completionRate}%`}
                    icon={BarChart3}
                    color="text-purple-600 dark:text-purple-400"
                    bgColor="bg-purple-50 dark:bg-purple-900/20"
                />
            </div>

            {/* Technician Reports Section */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {isAdmin ? 'All Technician Reports' : 'My Reports'}
                    </h2>
                    {techReports.length > 0 && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleExportCSV}
                                disabled={loading || reportsLoading}
                                className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2"
                            >
                                <Download size={14} />
                                Export CSV
                            </button>
                            <button
                                onClick={handleExportReports}
                                disabled={loading || reportsLoading}
                                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2"
                            >
                                <Download size={14} />
                                Export JSON
                            </button>
                        </div>
                    )}
                </div>
                
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {techReports.map((report) => (
                            <div key={report.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{report.title}</h3>
                                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                                                report.status === 'pending' 
                                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                                    : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                            }`}>
                                                {report.status === 'pending' ? 'Pending' : 'Reviewed'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {isAdmin && `By: ${report.technician_name} | `}
                                            Date: {new Date(report.report_date || report.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setViewingReport(report)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                            title="View"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        {isAdmin && report.status === 'pending' && (
                                            <button
                                                onClick={() => handleMarkAsReviewed(report.id)}
                                                disabled={loading}
                                                className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                                                title="Mark as Reviewed"
                                            >
                                                <CheckCircle size={16} />
                                            </button>
                                        )}
                                        {(isAdmin || report.technician_id === user?.id) && (
                                            <button
                                                onClick={() => handleDeleteReport(report.id)}
                                                disabled={loading}
                                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                    {report.description}
                                </p>
                                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <p className="text-xs text-gray-400">
                                        Submitted: {new Date(report.created_at).toLocaleString()}
                                        {report.reviewed_at && ` | Reviewed: ${new Date(report.reviewed_at).toLocaleString()}`}
                                        {report.reviewer_name && ` by ${report.reviewer_name}`}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Report Type Content */}
            {displayCases.length > 0 && (
                <>
                    {reportType === 'cases' && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Case Status Distribution</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-600 dark:text-gray-400">Pending Cases</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{stats.pendingCases}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                            <div className="bg-yellow-500 h-3 rounded-full" style={{ width: `${stats.totalCases ? (stats.pendingCases / stats.totalCases) * 100 : 0}%` }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-600 dark:text-gray-400">Ongoing Cases</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{stats.ongoingCases}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                            <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${stats.totalCases ? (stats.ongoingCases / stats.totalCases) * 100 : 0}%` }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-600 dark:text-gray-400">Completed Cases</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{stats.completedCases}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                            <div className="bg-green-500 h-3 rounded-full" style={{ width: `${stats.totalCases ? (stats.completedCases / stats.totalCases) * 100 : 0}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white p-6 pb-0">Recent Cases</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Case ID</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">ATM/Bank</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Type</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Created</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayCases.slice(0, 10).map((caseItem) => (
                                                <tr key={caseItem.id} className="border-b border-gray-100 dark:border-gray-700">
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{getField(caseItem, 'caseId')}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{getField(caseItem, 'atmName')} / {caseItem.bank}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{getField(caseItem, 'caseType')}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                            caseItem.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                                            caseItem.status === 'Ongoing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                                                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                                        }`}>
                                                            {caseItem.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                        {caseItem.createdAt || caseItem.created_at ? new Date(caseItem.createdAt || caseItem.created_at).toLocaleDateString() : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {reportType === 'banks' && Object.keys(bankReport()).length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white p-6 pb-0">Bank-wise Case Report</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Bank Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Total Cases</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Completed</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Pending</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Success Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(bankReport()).map(([bank, data]) => (
                                            <tr key={bank} className="border-b border-gray-100 dark:border-gray-700">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{bank}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{data.total}</td>
                                                <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">{data.completed}</td>
                                                <td className="px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400">{data.pending}</td>
                                                <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">{((data.completed / data.total) * 100).toFixed(1)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {reportType === 'districts' && Object.keys(districtReport()).length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white p-6 pb-0">District-wise Case Report</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">District</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Total Cases</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Completed</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Completion Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(districtReport()).map(([district, data]) => (
                                            <tr key={district} className="border-b border-gray-100 dark:border-gray-700">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{district}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{data.total}</td>
                                                <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">{data.completed}</td>
                                                <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">{((data.completed / data.total) * 100).toFixed(1)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {reportType === 'problems' && Object.keys(problemReport()).length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white p-6 pb-0">Problem Type Analysis</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Problem Type</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Total Reports</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Resolved</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Resolution Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(problemReport()).map(([problem, data]) => (
                                            <tr key={problem} className="border-b border-gray-100 dark:border-gray-700">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{problem}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{data.total}</td>
                                                <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">{data.resolved}</td>
                                                <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">{((data.resolved / data.total) * 100).toFixed(1)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {displayCases.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Data Available</h3>
                    <p className="text-gray-500 dark:text-gray-400">There are no cases to generate reports for the selected date range.</p>
                </div>
            )}

            {/* Submit Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`max-w-lg w-full rounded-xl shadow-xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className={`flex justify-between items-center p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Submit New Report</h2>
                            <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Report Title *</label>
                                <input
                                    type="text"
                                    value={reportForm.title}
                                    onChange={(e) => setReportForm({...reportForm, title: e.target.value})}
                                    placeholder="Enter report title"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Report Date</label>
                                <input
                                    type="date"
                                    value={reportForm.date}
                                    onChange={(e) => setReportForm({...reportForm, date: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                                <textarea
                                    value={reportForm.description}
                                    onChange={(e) => setReportForm({...reportForm, description: e.target.value})}
                                    rows="5"
                                    placeholder="Describe the issue or report details..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className={`flex justify-end gap-3 p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitReport}
                                disabled={loading}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                    <Send size={16} />
                                )}
                                Submit Report
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Report Modal */}
            {viewingReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`max-w-2xl w-full rounded-xl shadow-xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className={`flex justify-between items-center p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Report Details</h2>
                            <button onClick={() => setViewingReport(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Title</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">{viewingReport.title}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Submitted By</p>
                                <p className="text-gray-900 dark:text-white">{viewingReport.technician_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Report Date</p>
                                <p className="text-gray-900 dark:text-white">{new Date(viewingReport.report_date || viewingReport.date).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                    viewingReport.status === 'pending' 
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                        : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                }`}>
                                    {viewingReport.status === 'pending' ? 'Pending Review' : 'Reviewed'}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                                <p className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{viewingReport.description}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Submitted At</p>
                                <p className="text-gray-900 dark:text-white">{new Date(viewingReport.created_at).toLocaleString()}</p>
                            </div>
                            {viewingReport.reviewed_at && (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Reviewed At</p>
                                    <p className="text-gray-900 dark:text-white">{new Date(viewingReport.reviewed_at).toLocaleString()}</p>
                                </div>
                            )}
                            {viewingReport.reviewer_name && (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Reviewed By</p>
                                    <p className="text-gray-900 dark:text-white">{viewingReport.reviewer_name}</p>
                                </div>
                            )}
                        </div>
                        
                        <div className={`flex justify-end p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <button
                                onClick={() => setViewingReport(null)}
                                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
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