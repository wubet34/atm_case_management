import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  RefreshCw,
  CheckCircle,
  TrendingUp,
  Calendar,
  Activity,
} from 'lucide-react';
import { useDarkMode } from '../context/DarkModeContext';
import { useAuth } from '../context/AuthContext';
import { useCases } from '../context/CaseContext';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    ongoing: 0,
    completed: 0,
  });

  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  
  const { darkMode } = useDarkMode();
  const { user } = useAuth();
  const { cases, loading: casesLoading } = useCases();

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
    if (!dateString) return null;
    try {
      return new Date(dateString);
    } catch {
      return null;
    }
  };

  // Get relative time
  const getRelativeTime = (dateString) => {
    if (!dateString) return 'Recently';
    
    const date = formatDate(dateString);
    if (!date) return 'Recently';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Get activity text
  const getActivityText = (caseItem) => {
    const caseId = getField(caseItem, 'caseId');
    switch(caseItem.status) {
      case 'Completed':
        return `Case ${caseId} completed`;
      case 'Ongoing':
        return `Work started on case ${caseId}`;
      case 'Appointed':
        return `Technician assigned to case ${caseId}`;
      case 'Pending':
        return `New case ${caseId} created`;
      case 'Terminated':
        return `Case ${caseId} terminated`;
      default:
        return `Case ${caseId} updated`;
    }
  };

  // Get last 6 months
  const getLast6Months = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.getMonth(),
        year: date.getFullYear(),
        shortName: date.toLocaleString('default', { month: 'short' })
      });
    }
    return months;
  };

  useEffect(() => {
    if (!casesLoading && cases) {
      loadDashboardData();
    }
  }, [cases, user, casesLoading]);

  const loadDashboardData = () => {
    setLoading(true);
    
    try {
      // Filter cases based on user role
      let userCases = cases;
      if (isTechnician) {
        userCases = cases.filter(c => c.technician === user?.name);
      }

      // Calculate statistics
      const total = userCases.length;
      const pending = userCases.filter(c => c.status === 'Pending').length;
      const ongoing = userCases.filter(c => c.status === 'Ongoing').length;
      const completed = userCases.filter(c => c.status === 'Completed').length;

      setStats({
        total,
        pending,
        ongoing,
        completed,
      });

      // Get recent activities (last 5 cases by updated date)
      const activities = [...userCases]
        .sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.updated_at || a.createdAt || a.created_at);
          const dateB = new Date(b.updatedAt || b.updated_at || b.createdAt || b.created_at);
          return dateB - dateA;
        })
        .slice(0, 5)
        .map(c => ({
          text: getActivityText(c),
          time: getRelativeTime(c.updatedAt || c.updated_at || c.createdAt || c.created_at),
          caseId: getField(c, 'caseId')
        }));
      setRecentActivities(activities);

      // Get upcoming deadlines (cases that are pending or appointed with priority)
      const deadlines = userCases
        .filter(c => c.status === 'Pending' || c.status === 'Appointed')
        .sort((a, b) => {
          const priorityOrder = { Urgent: 1, High: 2, Medium: 3, Low: 4 };
          return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
        })
        .slice(0, 5)
        .map(c => ({
          text: `${getField(c, 'caseId')} - ${getField(c, 'caseType')}`,
          type: c.priority?.toLowerCase() || 'medium',
          caseId: getField(c, 'caseId')
        }));
      setUpcomingDeadlines(deadlines);

      // Get monthly data for chart (last 6 months)
      const last6Months = getLast6Months();
      const monthlyStats = last6Months.map(month => {
        const monthCases = userCases.filter(c => {
          const createdAt = new Date(c.createdAt || c.created_at);
          return createdAt.getMonth() === month.month && 
                 createdAt.getFullYear() === month.year;
        });
        return {
          month: month.shortName,
          cases: monthCases.length,
          completed: monthCases.filter(c => c.status === 'Completed').length
        };
      });
      setMonthlyData(monthlyStats);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
        </div>
        <div className={`${bgColor} p-2 sm:p-3 rounded-xl shrink-0`}>
          <Icon size={20} className={`${color} sm:w-6 sm:h-6`} />
        </div>
      </div>
    </div>
  );

  if (loading || casesLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const completionRate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0;
  const pendingRate = stats.total > 0 ? ((stats.pending / stats.total) * 100).toFixed(1) : 0;
  const ongoingRate = stats.total > 0 ? ((stats.ongoing / stats.total) * 100).toFixed(1) : 0;

  return (
    <div className="px-3 sm:px-4 md:px-6 pb-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
          {isAdmin ? 'Welcome back, Admin!' : `Welcome back, ${user?.name || 'Technician'}!`}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="Total Cases"
          value={stats.total}
          icon={FileText}
          color="text-orange-600 dark:text-orange-400"
          bgColor="bg-orange-50 dark:bg-orange-900/20"
        />
        <StatCard
          title="Pending Cases"
          value={stats.pending}
          icon={Clock}
          color="text-yellow-600 dark:text-yellow-400"
          bgColor="bg-yellow-50 dark:bg-yellow-900/20"
        />
        <StatCard
          title="Ongoing Cases"
          value={stats.ongoing}
          icon={RefreshCw}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatCard
          title="Completed Cases"
          value={stats.completed}
          icon={CheckCircle}
          color="text-green-600 dark:text-green-400"
          bgColor="bg-green-50 dark:bg-green-900/20"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Case Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">Case Distribution</h2>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <div className="flex justify-between text-xs sm:text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Pending Cases</span>
                <span className="font-semibold text-gray-900 dark:text-white">{stats.pending} cases</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3">
                <div 
                  className="bg-yellow-500 h-2 sm:h-3 rounded-full transition-all duration-1000" 
                  style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs sm:text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Ongoing Cases</span>
                <span className="font-semibold text-gray-900 dark:text-white">{stats.ongoing} cases</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3">
                <div 
                  className="bg-blue-500 h-2 sm:h-3 rounded-full transition-all duration-1000" 
                  style={{ width: `${stats.total > 0 ? (stats.ongoing / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs sm:text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Completed Cases</span>
                <span className="font-semibold text-gray-900 dark:text-white">{stats.completed} cases</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3">
                <div 
                  className="bg-green-500 h-2 sm:h-3 rounded-full transition-all duration-1000" 
                  style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Simple Pie Chart */}
          <div className="mt-6 sm:mt-8 flex justify-center">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {stats.total > 0 && (
                  <>
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      fill="none" 
                      stroke="#f59e0b" 
                      strokeWidth="15"
                      strokeDasharray={`${(stats.pending / stats.total) * 283} 283`}
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)"
                    />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      fill="none" 
                      stroke="#3b82f6" 
                      strokeWidth="15"
                      strokeDasharray={`${(stats.ongoing / stats.total) * 283} 283`}
                      strokeDashoffset={`-${(stats.pending / stats.total) * 283}`}
                      transform="rotate(-90 50 50)"
                    />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="45" 
                      fill="none" 
                      stroke="#10b981" 
                      strokeWidth="15"
                      strokeDasharray={`${(stats.completed / stats.total) * 283} 283`}
                      strokeDashoffset={`-${((stats.pending + stats.ongoing) / stats.total) * 283}`}
                      transform="rotate(-90 50 50)"
                    />
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Total Cases</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Pending</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
              <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Ongoing</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
              <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Completed</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <TrendingUp size={18} className="sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Performance Metrics</h3>
          </div>
          <div className="space-y-4 sm:space-y-6">
            <div>
              <div className="flex justify-between text-xs sm:text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Completion Rate</span>
                <span className="font-semibold text-gray-900 dark:text-white">{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3">
                <div className="bg-green-500 h-2 sm:h-3 rounded-full transition-all duration-1000" style={{ width: `${completionRate}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs sm:text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Pending Rate</span>
                <span className="font-semibold text-gray-900 dark:text-white">{pendingRate}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3">
                <div className="bg-yellow-500 h-2 sm:h-3 rounded-full transition-all duration-1000" style={{ width: `${pendingRate}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs sm:text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Ongoing Rate</span>
                <span className="font-semibold text-gray-900 dark:text-white">{ongoingRate}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3">
                <div className="bg-blue-500 h-2 sm:h-3 rounded-full transition-all duration-1000" style={{ width: `${ongoingRate}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.pending + stats.ongoing}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Active Cases</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      {monthlyData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-gray-700 mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Case Trend</h3>
          <div className="overflow-x-auto">
            <div className="min-w-125">
              <div className="flex items-end gap-4 h-48">
                {monthlyData.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full flex flex-col items-center">
                      <div 
                        className="w-full bg-orange-500 rounded-t transition-all duration-500 hover:bg-orange-600"
                        style={{ height: `${(item.cases / Math.max(...monthlyData.map(d => d.cases), 1)) * 150}px` }}
                      >
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {item.cases}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.month}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Total Cases</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <Activity size={18} className="sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Recent Activity</h3>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No recent activity</p>
            ) : (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between text-xs sm:text-sm py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                  <span className="text-gray-600 dark:text-gray-400">{activity.text}</span>
                  <span className="text-gray-400 dark:text-gray-500 text-[10px] sm:text-xs">{activity.time}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Priority Cases */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <Calendar size={18} className="sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Priority Cases</h3>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No pending cases</p>
            ) : (
              upcomingDeadlines.map((deadline, index) => (
                <div key={index} className={`flex items-center justify-between text-xs sm:text-sm p-2 sm:p-3 rounded-lg
                  ${deadline.type === 'urgent' ? 'bg-red-50 dark:bg-red-900/20' : 
                    deadline.type === 'high' ? 'bg-orange-50 dark:bg-orange-900/20' :
                    'bg-yellow-50 dark:bg-yellow-900/20'}`}
                >
                  <span className={`font-medium text-xs sm:text-sm
                    ${deadline.type === 'urgent' ? 'text-red-700 dark:text-red-400' : 
                      deadline.type === 'high' ? 'text-orange-700 dark:text-orange-400' :
                      'text-yellow-700 dark:text-yellow-400'}`}
                  >
                    {deadline.text}
                  </span>
                  <span className={`text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded
                    ${deadline.type === 'urgent' ? 'bg-red-100 dark:bg-red-900/40 text-red-500 dark:text-red-400' : 
                      deadline.type === 'high' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-500 dark:text-orange-400' :
                      'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-500 dark:text-yellow-400'}`}
                  >
                    {deadline.type === 'urgent' ? 'Urgent' : deadline.type === 'high' ? 'High Priority' : 'Medium'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;