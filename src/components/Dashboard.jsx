import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import axios from 'axios';
import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer
} from 'recharts';
import { User } from 'lucide-react'

// Import the images
import taskIcon from '../assets/total-task.png';
import completedTaskIcon from '../assets/complete-task.jpg';
import pendingTaskIcon from '../assets/pending-tasks.png';
import performanceIcon from '../assets/performance.png';
import userIcon from '../assets/user.jpg';

// TaskDistributionChart component definition
const TaskDistributionChart = ({ completed, pending, inProgress }) => {
  const pieData = [
    { name: 'Completed', value: completed },
    { name: 'Pending', value: pending },
    { name: 'In Progress', value: inProgress }
  ];

  const COLORS = ['#22c55e', '#f97316', '#3b82f6'];

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const response = await axios.get(`http://localhost:5000/api/dashboard/${user.employeeId}`);
      setStats(response.data);
      setLoading(false);
      setError(null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
      setError('Failed to load dashboard data. Please try again later.');
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 30s (optional)
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return <p className="p-10 text-lg font-medium text-gray-600">Loading user...</p>;
  if (loading) return <p className="p-10 text-lg font-medium text-gray-600">Fetching dashboard data...</p>;
  if (error) return <p className="p-10 text-lg font-medium text-red-600">{error}</p>;
  if (!stats) return <p className="p-10 text-lg font-medium text-red-600">Failed to load data.</p>;

  const { role, employeeId } = user;

  const barData = [
    { name: 'Week 1', Performance: 70 },
    { name: 'Week 2', Performance: 76 },
    { name: 'Week 3', Performance: 80 },
    { name: 'Week 4', Performance: stats.performance },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col">
      <Navbar />

      <div className="p-8 flex-1">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 
            className="text-4xl font-bold mb-4"
            style={{
              background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}
          >
            Welcome, {user.name}
          </h1>
          <h2 className="text-xl font-semibold text-gray-600">
            Role: <span className="text-blue-600 font-bold">{role.toUpperCase()}</span>
          </h2>
        </div>

        {/* Stats Cards */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${role === 'admin' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-6 mb-8`}>
          <StatsCard 
            title="Total Tickets" 
            value={stats.totalTasks} 
            color="from-blue-400 to-blue-600"
            icon={taskIcon}
            alt="Task Icon"
          />
          <StatsCard 
            title="Completed Tickets" 
            value={stats.completedTasks} 
            color="from-green-400 to-green-600"
            icon={completedTaskIcon}
            alt="Completed Task Icon"
          />
          <StatsCard 
            title="Pending Tickets" 
            value={stats.pendingTasks} 
            color="from-orange-400 to-orange-600"
            icon={pendingTaskIcon}
            alt="Pending Task Icon"
          />
          <StatsCard 
            title="Performance" 
            value={`${stats.performance}%`} 
            color="from-indigo-400 to-indigo-600"
            icon={performanceIcon}
            alt="Performance Icon"
          />
          {role === 'admin' && (
            <StatsCard 
              title="Total Users" 
              value={stats.totalUsers || 0} 
              color="from-purple-400 to-purple-600"
              icon={userIcon}
              alt="User Icon"
            />
          )}
        </div>

        {/* Performance Progress */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 transform transition-all duration-300 hover:shadow-2xl">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Performance Progress</h3>
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
              <div
                className="h-6 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000 ease-out"
                style={{ width: `${stats.performance}%` }}
              ></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-700">{stats.performance}%</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Task Distribution Chart */}
          <div className="bg-white rounded-2xl shadow-xl p-6 transform transition-all duration-300 hover:shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Ticket Distribution</h3>
            <TaskDistributionChart 
              completed={stats.completedTasks} 
              pending={stats.pendingTasks} 
              inProgress={stats.inProgressTasks || 0} 
            />
          </div>

          {/* Weekly Performance Chart */}
          <div className="bg-white rounded-2xl shadow-xl p-6 transform transition-all duration-300 hover:shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Weekly Performance</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
                <YAxis tick={{ fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="Performance" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 transform transition-all duration-300 hover:shadow-2xl">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Recent Activities</h3>
          <div className="space-y-3">
            {stats.activities?.length > 0 ? (
              stats.activities.map((item, index) => (
                <div 
                  key={item.id} 
                  className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-700">{item.activity}</span>
                  </div>
                  <span className="text-sm text-gray-500">{item.time}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <User className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-500 italic">No recent activity available</p>
              </div>
            )}
          </div>
        </div>

        {/* Role Panel */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white transform transition-all duration-300 hover:shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold">{role.charAt(0).toUpperCase() + role.slice(1)} Panel</h3>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
          </div>
          <p className="text-blue-100 mb-4">
            {role === 'admin' && "Manage users, roles, and system settings."}
            {role === 'employee' && "View your tasks, projects, and profile information."}
            {role === 'hr' && "Manage employee data, leave requests, and payroll."}
            {role === 'manager' && "View team progress, assign tasks, and track performance."}
          </p>
          <div className="flex space-x-3">
            <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-300">
              View Details
            </button>
            <button className="bg-transparent border border-white/30 hover:bg-white/10 text-white px-4 py-2 rounded-lg transition-all duration-300">
              Settings
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

const StatsCard = ({ title, value, color, icon, alt }) => {
  const [imgError, setImgError] = useState(false);

  const handleImageError = () => {
    setImgError(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-600">{title}</h3>
        {!imgError ? (
          <img 
            src={icon} 
            alt={alt} 
            className="w-10 h-10" 
            onError={handleImageError}
          />
        ) : (
          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
          {value}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;