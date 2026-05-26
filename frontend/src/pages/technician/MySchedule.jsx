import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  CheckCircle, 
  XCircle,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  AlertCircle,
  Building,
  User
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useDarkMode } from '../../context/DarkModeContext';
import { useAuth } from '../../context/AuthContext';
import { useCases } from '../../context/CaseContext';

const MySchedule = () => {
  const { darkMode } = useDarkMode();
  const { user } = useAuth();
  const { cases, loading } = useCases();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('week'); // 'week' or 'month'

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
      return dateString.split('T')[0];
    } catch {
      return null;
    }
  };

  // Get cases assigned to current technician
  const myCases = cases.filter(c => c.technician === user?.name);

  // Get schedule for a specific date
  const getScheduleForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return myCases.filter(c => {
      // Case is active on this date if it was created before/on and not completed before
      const createdDate = formatDate(c.createdAt || c.created_at);
      const completedDate = formatDate(c.completedAt || c.completed_at || c.end_date);
      return createdDate <= dateStr && (!completedDate || completedDate >= dateStr);
    });
  };

  // Get week days
  const getWeekDays = () => {
    const week = [];
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      week.push(day);
    }
    return week;
  };

  // Get month days
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Add previous month days
    const startDay = firstDay.getDay();
    for (let i = startDay - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push(prevDate);
    }
    
    // Add current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add next month days to complete 42 days (6 weeks)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Completed': return <CheckCircle size={14} className="text-green-500" />;
      case 'Ongoing': return <Clock size={14} className="text-purple-500" />;
      case 'Appointed': return <Clock size={14} className="text-blue-500" />;
      default: return <AlertCircle size={14} className="text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Ongoing': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'Appointed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const selectedDateSchedule = getScheduleForDate(selectedDate);

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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">My Schedule</h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
          View your assigned cases schedule
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Calendar Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setView('week')}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      view === 'week' 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setView('month')}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      view === 'month' 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    Month
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={navigatePrevious}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {view === 'week' 
                      ? `Week of ${getWeekDays()[0].toLocaleDateString('default', { month: 'short', day: 'numeric' })}`
                      : currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })
                    }
                  </span>
                  <button
                    onClick={navigateNext}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <button
                    onClick={goToToday}
                    className="ml-2 px-3 py-1 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                  >
                    Today
                  </button>
                </div>
              </div>
            </div>

            {/* Week View */}
            {view === 'week' && (
              <div className="overflow-x-auto">
                <div className="min-w-175">
                  <div className="grid grid-cols-7">
                    {getWeekDays().map((day, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedDate(day)}
                        className={`p-3 text-center border-r border-gray-100 dark:border-gray-700 cursor-pointer transition-colors ${
                          isSelected(day) 
                            ? 'bg-orange-50 dark:bg-orange-900/20' 
                            : isToday(day) 
                              ? 'bg-blue-50 dark:bg-blue-900/20'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {day.toLocaleDateString('default', { weekday: 'short' })}
                        </p>
                        <p className={`text-2xl font-semibold mt-1 ${
                          isToday(day) 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {day.getDate()}
                        </p>
                        <div className="mt-2">
                          {getScheduleForDate(day).length > 0 && (
                            <div className="flex justify-center gap-1">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              <span className="text-xs text-gray-500">
                                {getScheduleForDate(day).length}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Month View */}
            {view === 'month' && (
              <div className="overflow-x-auto">
                <div className="min-w-175">
                  <div className="grid grid-cols-7">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="p-2 text-center border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{day}</p>
                      </div>
                    ))}
                    {getMonthDays().map((day, index) => {
                      const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                      const scheduleCount = getScheduleForDate(day).length;
                      return (
                        <div
                          key={index}
                          onClick={() => setSelectedDate(day)}
                          className={`p-2 min-h-20 border border-gray-100 dark:border-gray-700 cursor-pointer transition-colors ${
                            isSelected(day) 
                              ? 'bg-orange-50 dark:bg-orange-900/20' 
                              : isToday(day) 
                                ? 'bg-blue-50 dark:bg-blue-900/20'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          } ${!isCurrentMonth ? 'opacity-50' : ''}`}
                        >
                          <p className={`text-sm ${
                            isToday(day) 
                              ? 'text-blue-600 dark:text-blue-400 font-semibold' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {day.getDate()}
                          </p>
                          {scheduleCount > 0 && (
                            <div className="mt-1">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                <span className="text-xs text-gray-500">{scheduleCount} cases</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Schedule Details Section */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {selectedDate.toLocaleDateString('default', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
            </div>
            <div className="p-4 max-h-125 overflow-y-auto">
              {selectedDateSchedule.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon size={48} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No cases scheduled for this day</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateSchedule.map((caseItem) => (
                    <div key={caseItem.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(caseItem.status)}
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {getField(caseItem, 'caseId')}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(caseItem.status)}`}>
                          {caseItem.status}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                        {getField(caseItem, 'atmName')}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <Building size={12} />
                        <span>{caseItem.bank}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <MapPin size={12} />
                        <span>{caseItem.district} / {caseItem.branch}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <Briefcase size={12} />
                        <span>{getField(caseItem, 'caseType')}</span>
                      </div>
                      {caseItem.priority && caseItem.priority !== 'Medium' && (
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            caseItem.priority === 'Urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                            caseItem.priority === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}>
                            {caseItem.priority} Priority
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Weekly Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total Cases</span>
                <span className="font-semibold text-gray-900 dark:text-white">{myCases.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Active Cases</span>
                <span className="font-semibold text-blue-600">{myCases.filter(c => c.status !== 'Completed').length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Completed</span>
                <span className="font-semibold text-green-600">
                  {myCases.filter(c => c.status === 'Completed').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MySchedule;