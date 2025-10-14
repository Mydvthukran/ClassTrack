import React, { useState, useMemo } from 'react';
import { Calendar, Clock, TrendingUp, AlertTriangle, BarChart3, Upload, Moon, Sun } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const EXAMPLE_SCHEDULE = `CS101 - Data Structures
Mon/Wed/Fri 9:00 AM - 10:30 AM
Building: ENG-205

MATH215 - Linear Algebra
Tue/Thu 11:00 AM - 12:30 PM
Building: SCI-101

ENGL102 - Technical Writing
Mon/Wed 2:00 PM - 3:30 PM
Building: LIB-303

PHYS201 - Physics Lab
Thu 3:00 PM - 6:00 PM
Building: LAB-102

CS201 - Algorithms
Tue/Thu 9:30 AM - 11:00 AM
Building: ENG-207`;

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];
const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function parseSchedule(text) {
  const blocks = text.trim().split(/\n\s*\n/);
  const classes = [];
  
  blocks.forEach(block => {
    const lines = block.split('\n').filter(l => l.trim());
    if (lines.length < 2) return;
    
    // Extract course code and name
    const firstLine = lines[0];
    const codeMatch = firstLine.match(/([A-Z]{2,4}\d{3,4})/);
    const code = codeMatch ? codeMatch[1] : 'UNKNOWN';
    const name = firstLine.replace(code, '').replace(/^[\s-]+/, '').trim();
    
    // Extract days
    const dayLine = lines[1];
    const dayMatches = dayLine.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/gi);
    const days = dayMatches ? dayMatches.map(d => {
      const dayMap = {
        'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday',
        'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday'
      };
      return dayMap[d.charAt(0).toUpperCase() + d.slice(1).toLowerCase()];
    }) : [];
    
    // Extract times
    const timeMatches = dayLine.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi);
    if (timeMatches && timeMatches.length >= 2) {
      const startTime = parseTime(timeMatches[0]);
      const endTime = parseTime(timeMatches[1]);
      const duration = (endTime - startTime) / 60;
      
      // Extract location
      const locationLine = lines.find(l => l.toLowerCase().includes('building'));
      const location = locationLine ? locationLine.replace(/building:\s*/i, '').trim() : '';
      
      // Create class instance for each day
      days.forEach(day => {
        classes.push({
          code,
          name,
          day,
          startTime,
          endTime,
          duration,
          location
        });
      });
    }
  });
  
  return classes;
}

function parseTime(timeStr) {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 0;
  
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  return hours * 60 + minutes;
}

function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
}

function detectFreeBlocks(classes) {
  const freeBlocks = [];
  
  DAY_ORDER.forEach(day => {
    const dayClasses = classes
      .filter(c => c.day === day)
      .sort((a, b) => a.startTime - b.startTime);
    
    if (dayClasses.length === 0) return;
    
    // Check before first class
    if (dayClasses[0].startTime > 540) { // After 9 AM
      freeBlocks.push({
        day,
        startTime: 480, // 8 AM
        endTime: dayClasses[0].startTime,
        duration: (dayClasses[0].startTime - 480) / 60,
        category: 'Morning Free Time'
      });
    }
    
    // Check gaps between classes
    for (let i = 0; i < dayClasses.length - 1; i++) {
      const gap = dayClasses[i + 1].startTime - dayClasses[i].endTime;
      
      if (gap >= 60) {
        let category = 'Short Break';
        if (gap >= 90 && gap < 180) category = 'Study Block';
        else if (gap >= 180) category = 'Long Gap';
        
        freeBlocks.push({
          day,
          startTime: dayClasses[i].endTime,
          endTime: dayClasses[i + 1].startTime,
          duration: gap / 60,
          category
        });
      }
    }
    
    // Check after last class
    const lastClass = dayClasses[dayClasses.length - 1];
    if (lastClass.endTime < 1020) { // Before 5 PM
      freeBlocks.push({
        day,
        startTime: lastClass.endTime,
        endTime: 1080, // 6 PM
        duration: (1080 - lastClass.endTime) / 60,
        category: 'Afternoon Free Time'
      });
    }
  });
  
  return freeBlocks;
}

function detectConflicts(classes) {
  const conflicts = [];
  
  for (let i = 0; i < classes.length; i++) {
    for (let j = i + 1; j < classes.length; j++) {
      const a = classes[i];
      const b = classes[j];
      
      if (a.day === b.day) {
        if (a.startTime < b.endTime && a.endTime > b.startTime) {
          conflicts.push({ class1: a, class2: b });
        }
      }
    }
  }
  
  return conflicts;
}

function calculateHealthScore(classes) {
  let score = 100;
  
  // Calculate daily hours
  const dailyHours = {};
  DAY_ORDER.forEach(day => {
    dailyHours[day] = classes
      .filter(c => c.day === day)
      .reduce((sum, c) => sum + c.duration, 0);
  });
  
  // Check balance (standard deviation)
  const hours = Object.values(dailyHours).filter(h => h > 0);
  if (hours.length > 0) {
    const mean = hours.reduce((a, b) => a + b, 0) / hours.length;
    const variance = hours.reduce((sum, h) => sum + Math.pow(h - mean, 2), 0) / hours.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev > 2) {
      score -= stdDev * 5;
    }
  }
  
  // Check back-to-back classes
  DAY_ORDER.forEach(day => {
    const dayClasses = classes
      .filter(c => c.day === day)
      .sort((a, b) => a.startTime - b.startTime);
    
    for (let i = 0; i < dayClasses.length - 1; i++) {
      const gap = dayClasses[i + 1].startTime - dayClasses[i].endTime;
      if (gap < 15) {
        score -= 8;
      }
    }
  });
  
  // Check early morning classes
  const earlyClasses = classes.filter(c => c.startTime < 480); // Before 8 AM
  score -= earlyClasses.length * 10;
  
  // Check late evening classes
  const lateClasses = classes.filter(c => c.endTime > 1080); // After 6 PM
  score -= lateClasses.length * 5;
  
  // Total hours sweet spot
  const totalHours = classes.reduce((sum, c) => sum + c.duration, 0);
  if (totalHours < 12) {
    score -= (12 - totalHours) * 3;
  } else if (totalHours > 18) {
    score -= (totalHours - 18) * 2;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

export default function ClassTrack() {
  const [scheduleText, setScheduleText] = useState('');
  const [classes, setClasses] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const freeBlocks = useMemo(() => detectFreeBlocks(classes), [classes]);
  const conflicts = useMemo(() => detectConflicts(classes), [classes]);
  const healthScore = useMemo(() => calculateHealthScore(classes), [classes]);
  
  const courseData = useMemo(() => {
    const courseHours = {};
    classes.forEach(cls => {
      if (!courseHours[cls.code]) {
        courseHours[cls.code] = { name: cls.code, hours: 0 };
      }
      courseHours[cls.code].hours += cls.duration;
    });
    return Object.values(courseHours);
  }, [classes]);
  
  const dailyData = useMemo(() => {
    return DAY_ORDER.map(day => {
      const hours = classes
        .filter(c => c.day === day)
        .reduce((sum, c) => sum + c.duration, 0);
      return { day: day.slice(0, 3), hours: parseFloat(hours.toFixed(1)) };
    });
  }, [classes]);
  
  const handleParse = () => {
    const parsed = parseSchedule(scheduleText);
    setClasses(parsed);
    setActiveTab('overview');
  };
  
  const loadExample = () => {
    setScheduleText(EXAMPLE_SCHEDULE);
  };
  
  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100';
  const cardClass = darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
  const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';
  
  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300`}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                ClassTrack
              </h1>
              <p className={textClass}>Smart Schedule Analyzer</p>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-lg ${cardClass} shadow-lg hover:scale-105 transition-transform`}
          >
            {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </div>
        
        {classes.length === 0 ? (
          // Input Section
          <div className={`${cardClass} rounded-2xl shadow-xl p-8`}>
            <div className="flex items-center gap-2 mb-6">
              <Upload className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold">Paste Your Schedule</h2>
            </div>
            
            <textarea
              value={scheduleText}
              onChange={(e) => setScheduleText(e.target.value)}
              placeholder="Paste your schedule here..."
              className={`w-full h-64 p-4 border-2 rounded-lg font-mono text-sm ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleParse}
                disabled={!scheduleText.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Analyze Schedule
              </button>
              <button
                onClick={loadExample}
                className={`px-6 py-3 rounded-lg font-semibold border-2 ${
                  darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'
                } transition-colors`}
              >
                Load Example
              </button>
            </div>
            
            <div className={`mt-6 p-4 ${darkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded-lg`}>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-semibold mb-2`}>
                Format Example:
              </p>
              <pre className={`text-xs ${textClass} overflow-x-auto`}>
{`CS101 - Data Structures
Mon/Wed/Fri 9:00 AM - 10:30 AM
Building: ENG-205`}
              </pre>
            </div>
          </div>
        ) : (
          // Results Section
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={textClass}>Total Classes</p>
                    <p className="text-3xl font-bold mt-1">{classes.length}</p>
                  </div>
                  <Calendar className="w-10 h-10 text-blue-600 opacity-50" />
                </div>
              </div>
              
              <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={textClass}>Weekly Hours</p>
                    <p className="text-3xl font-bold mt-1">
                      {classes.reduce((sum, c) => sum + c.duration, 0).toFixed(1)}
                    </p>
                  </div>
                  <Clock className="w-10 h-10 text-indigo-600 opacity-50" />
                </div>
              </div>
              
              <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={textClass}>Health Score</p>
                    <p className={`text-3xl font-bold mt-1 ${
                      healthScore >= 80 ? 'text-green-600' : 
                      healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {healthScore}/100
                    </p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-green-600 opacity-50" />
                </div>
              </div>
              
              <div className={`${cardClass} rounded-xl shadow-lg p-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={textClass}>Conflicts</p>
                    <p className={`text-3xl font-bold mt-1 ${
                      conflicts.length > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {conflicts.length}
                    </p>
                  </div>
                  <AlertTriangle className={`w-10 h-10 opacity-50 ${
                    conflicts.length > 0 ? 'text-red-600' : 'text-green-600'
                  }`} />
                </div>
              </div>
            </div>
            
            {/* Tabs */}
            <div className={`${cardClass} rounded-xl shadow-lg overflow-hidden`}>
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                {['overview', 'freeTime', 'schedule'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                      activeTab === tab
                        ? 'bg-blue-600 text-white'
                        : `${textClass} hover:bg-gray-100 dark:hover:bg-gray-700`
                    }`}
                  >
                    {tab === 'overview' ? 'Overview' : tab === 'freeTime' ? 'Free Time' : 'Schedule Grid'}
                  </button>
                ))}
              </div>
              
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Pie Chart */}
                      <div>
                        <h3 className="text-xl font-bold mb-4">Hours by Course</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={courseData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, hours }) => `${name}: ${hours.toFixed(1)}h`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="hours"
                            >
                              {courseData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Bar Chart */}
                      <div>
                        <h3 className="text-xl font-bold mb-4">Daily Workload</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={dailyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="hours" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    {/* Conflicts */}
                    {conflicts.length > 0 && (
                      <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          <h3 className="text-lg font-bold text-red-600">Schedule Conflicts Detected</h3>
                        </div>
                        {conflicts.map((conflict, idx) => (
                          <p key={idx} className="text-sm text-red-700 dark:text-red-300">
                            {conflict.class1.code} and {conflict.class2.code} overlap on {conflict.class1.day}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'freeTime' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold mb-4">Optimal Study Times</h3>
                    {freeBlocks.filter(b => b.category === 'Study Block').length === 0 ? (
                      <p className={textClass}>No ideal study blocks found (1.5-3 hour gaps)</p>
                    ) : (
                      freeBlocks
                        .filter(b => b.category === 'Study Block')
                        .map((block, idx) => (
                          <div key={idx} className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-semibold text-green-800 dark:text-green-300">
                                  {block.day}
                                </p>
                                <p className="text-sm text-green-700 dark:text-green-400">
                                  {formatTime(block.startTime)} - {formatTime(block.endTime)}
                                </p>
                              </div>
                              <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                {block.duration.toFixed(1)}h
                              </span>
                            </div>
                          </div>
                        ))
                    )}
                    
                    <h3 className="text-xl font-bold mb-4 mt-6">All Free Time Blocks</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {freeBlocks.map((block, idx) => (
                        <div key={idx} className={`${cardClass} border-2 ${
                          darkMode ? 'border-gray-700' : 'border-gray-200'
                        } rounded-lg p-4`}>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold">{block.day}</p>
                              <p className={`text-sm ${textClass}`}>
                                {formatTime(block.startTime)} - {formatTime(block.endTime)}
                              </p>
                              <p className="text-xs text-blue-600 mt-1">{block.category}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              block.category === 'Study Block' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                              block.category === 'Long Gap' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {block.duration.toFixed(1)}h
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {activeTab === 'schedule' && (
                  <div className="space-y-4">
                    {DAY_ORDER.map(day => {
                      const dayClasses = classes
                        .filter(c => c.day === day)
                        .sort((a, b) => a.startTime - b.startTime);
                      
                      if (dayClasses.length === 0) return null;
                      
                      return (
                        <div key={day} className={`border-2 ${
                          darkMode ? 'border-gray-700' : 'border-gray-200'
                        } rounded-lg p-4`}>
                          <h3 className="font-bold text-lg mb-3">{day}</h3>
                          <div className="space-y-2">
                            {dayClasses.map((cls, idx) => (
                              <div key={idx} className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg p-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-bold">{cls.code} - {cls.name}</p>
                                    <p className="text-sm opacity-90">
                                      {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                                    </p>
                                    {cls.location && (
                                      <p className="text-xs opacity-75 mt-1">{cls.location}</p>
                                    )}
                                  </div>
                                  <span className="bg-white/20 px-2 py-1 rounded text-sm">
                                    {cls.duration.toFixed(1)}h
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={() => setClasses([])}
              className={`w-full py-3 rounded-lg font-semibold border-2 ${
                darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'
              } ${cardClass} transition-colors`}
            >
              Analyze New Schedule
            </button>
          </div>
        )}
      </div>
    </div>
  );
}