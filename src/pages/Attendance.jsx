// src/pages/Attendance.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // <-- NEW: Import useNavigate for redirection
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import { FiSearch, FiCalendar } from "react-icons/fi";
import { useAuth } from '../context/AuthContext'; // Import the hook

const statusColors = {
  Present: "bg-green-500",
  Absent: "bg-red-500",
  Leave: "bg-yellow-500",
};

const Attendance = () => {
  const navigate = useNavigate(); // <-- NEW: Initialize the navigate function

  // Get all auth state and functions from the context
  const { 
    user, 
    isLoggedIn, 
    loginTime, 
    attendanceRecord, 
    logoutTime, 
    setIsLoggedIn, 
    setAttendanceRecord, 
    setLoginTime, 
    setLogoutTime,
    clearAuthState 
  } = useAuth();

  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmType, setConfirmType] = useState('');
  const [currentTimer, setCurrentTimer] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const currentDate = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour12: true, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
  
  const calculateWorkingHours = (loginTime, logoutTime) => {
    if (!loginTime || !logoutTime) return { hours: 0, minutes: 0, seconds: 0 };
    
    const parseTime = (timeStr) => {
      if (!timeStr || typeof timeStr !== 'string') return new Date(2000, 0, 1, 0, 0, 0);
      const [time, period] = timeStr.split(' ');
      if (!time || !period) return new Date(2000, 0, 1, 0, 0, 0);
      const [hours, minutes, seconds] = time.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return new Date(2000, 0, 1, 0, 0, 0);
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) hour24 += 12;
      if (period === 'AM' && hours === 12) hour24 = 0;
      return new Date(2000, 0, 1, hour24, minutes, seconds || 0);
    };
    
    const login = parseTime(loginTime);
    const logout = parseTime(logoutTime);
    const diffMs = logout - login;
    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return { hours, minutes, seconds };
  };
  
  const formatTimer = (timer) => {
    if (!timer) return '0s';
    const parts = [];
    if (timer.hours > 0) parts.push(`${timer.hours}h`);
    if (timer.minutes > 0 || timer.hours > 0) parts.push(`${timer.minutes}m`);
    parts.push(`${timer.seconds}s`);
    return parts.join(' ');
  };
  
  const fetchRecords = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/attendance");
      setRecords(res.data.records || res.data);
    } catch (err) {
      console.error("Error fetching records:", err);
      setToast({ show: true, message: "Failed to fetch attendance records", type: "error" });
    }
  };
  
  useEffect(() => {
    fetchRecords();
  }, []);
  
  useEffect(() => {
    let interval;
    if (isLoggedIn && loginTime) {
      interval = setInterval(() => {
        const now = new Date().toLocaleTimeString('en-US', { 
          hour12: true, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        });
        setCurrentTimer(calculateWorkingHours(loginTime, now));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLoggedIn, loginTime]);

  useEffect(() => {
    let temp = [...records];
    if (user && user.role !== 'admin' && user.role !== 'manager' && user.role !== 'hr') {
      temp = temp.filter(r => r.employeeId === user.employeeId);
    }
    if (search.trim() !== "") {
      temp = temp.filter((r) => r.name && r.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (date.trim() !== "") {
      temp = temp.filter((r) => r.date && r.date.startsWith(date));
    }
    setFiltered(temp);
  }, [search, date, records, user]);

  const handleLogin = async () => {
    if (!user) {
      setToast({ show: true, message: "User not found. Please login again.", type: "error" });
      return;
    }
    
    try {
      const response = await axios.post("http://localhost:5000/api/attendance", {
        employeeId: user.employeeId,
        name: user.name,
        date: currentDate,
        punch_in: currentTime
      });
      
      const record = {
        empId: user.employeeId,
        empName: user.name,
        loginTime: currentTime,
        date: currentDate,
        _id: response.data._id
      };

      setIsLoggedIn(true);
      setAttendanceRecord(record);
      setLoginTime(currentTime);
      
      setRecords(prev => [...prev, response.data]);
      setShowConfirmModal(false);
      setToast({ show: true, message: 'Login successful!', type: 'success' });
    } catch (error) {
      console.error("Login error:", error);
      setToast({ show: true, message: error.response?.data?.message || 'Login failed', type: 'error' });
    }
  };

  const handleLogout = async () => {
    if (!user || !attendanceRecord) {
      setToast({ show: true, message: "User or attendance record not found.", type: "error" });
      return;
    }
    
    try {
      const workingHours = calculateWorkingHours(attendanceRecord.loginTime, currentTime);
      const response = await axios.put("http://localhost:5000/api/attendance/logout", {
        employeeId: user.employeeId,
        date: currentDate,
        punch_out: currentTime,
        workingHours: formatTimer(workingHours)
      });
      
      setLogoutTime(currentTime);
      setIsLoggedIn(false);
      clearAuthState();
      
      setRecords(prev => prev.map(r => r._id === attendanceRecord._id ? response.data : r));
      setShowConfirmModal(false);
      setToast({ show: true, message: 'Logout successful! Redirecting...', type: 'success' });

      // <-- NEW: Add a delay before redirecting to show the toast message
      setTimeout(() => {
        navigate('/'); // Redirect to the login page
      }, 1500); // 1.5 second delay

    } catch (error) {
      console.error("Logout error:", error);
      setToast({ show: true, message: error.response?.data?.message || 'Logout failed', type: 'error' });
    }
  };

  const canViewAllRecords = user && (user.role === 'admin' || user.role === 'manager' || user.role === 'hr');

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col">
      <Navbar />
      <div className="p-6 max-w-7xl mx-auto flex-1 w-full">
        {/* Header with Login/Logout buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 w-full">
          <h1 className="text-4xl font-extrabold text-blue-700 flex-grow">
            {canViewAllRecords ? "All Attendance Records" : "My Attendance"}
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowLoginModal(true)}
              disabled={isLoggedIn || !user}
              className={`px-6 py-2 rounded-full shadow-md active:scale-95 transition ${
                isLoggedIn || !user ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setShowLogoutModal(true)}
              disabled={!isLoggedIn || !user}
              className={`px-6 py-2 rounded-full shadow-md active:scale-95 transition ${
                !isLoggedIn || !user ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              Logout
            </button>
          </div>
        </div>

        {/* TIMER DISPLAY */}
        {isLoggedIn && (
          <div className="bg-white rounded-xl shadow-lg mb-8 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-700">Current Session</h3>
                <p className="text-sm text-gray-500">Started at: {loginTime}</p>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {formatTimer(currentTimer)}
              </div>
            </div>
          </div>
        )}

        {/* FILTERS SECTION (Only for admin, manager, and HR) */}
        {canViewAllRecords && (
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <div className="relative w-full sm:w-2/5 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search employee..."
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="relative w-full sm:w-1/4 max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiCalendar className="text-gray-400" />
              </div>
              <input
                type="date"
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ATTENDANCE TABLE */}
        {attendanceRecord && (
          <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
            <div className="bg-blue-600 text-white p-4">
              <h3 className="text-lg font-semibold">
                {canViewAllRecords ? "Today's Attendance" : "My Today's Attendance"}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logout Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Working Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timer</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{attendanceRecord.empId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{attendanceRecord.empName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{attendanceRecord.loginTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{logoutTime || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {logoutTime ? formatTimer(calculateWorkingHours(attendanceRecord.loginTime, logoutTime)) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {isLoggedIn ? <span className="text-green-600 font-bold text-lg">{formatTimer(currentTimer)}</span> : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!filtered || filtered.length === 0 ? (
          <div className="text-center text-gray-600 text-xl mt-10">
            {canViewAllRecords ? "No attendance records found." : "You don't have any attendance records yet."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((rec, i) => (
              <div key={rec._id} className="bg-white p-6 rounded-3xl shadow-md border border-blue-200 hover:scale-105 transition-all opacity-0 animate-fadeIn" style={{ animationDelay: `${i * 0.1}s`, animationFillMode: "forwards" }}>
                <h2 className="text-2xl font-bold text-blue-700">{rec.name}</h2>
                <p className="text-gray-500 mt-1">Date: {rec.date}</p>
                <p className="text-gray-500">Punch In: {rec.punch_in}</p>
                <p className="text-gray-500">Punch Out: {rec.punch_out}</p>
                <p className="text-gray-500">Working Hours: {rec.workingHours || '-'}</p>
                <span className={`px-4 py-1 mt-3 inline-block text-white rounded-full ${statusColors[rec.status] || "bg-gray-500"}`}>{rec.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ ...toast, show: false })} />
      <Footer />

      {/* MODALS */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-green-600 text-center">Login Attendance</h2>
            <div className="space-y-4">
              <div><label className="font-semibold text-gray-700">Employee ID</label><input type="text" value={user?.employeeId || ''} readOnly className="w-full p-3 bg-gray-200 rounded-xl" /></div>
              <div><label className="font-semibold text-gray-700">Employee Name</label><input type="text" value={user?.name || ''} readOnly className="w-full p-3 bg-gray-200 rounded-xl" /></div>
              <div><label className="font-semibold text-gray-700">Date</label><input type="text" value={currentDate} readOnly className="w-full p-3 bg-gray-200 rounded-xl" /></div>
              <div><label className="font-semibold text-gray-700">Current Time</label><input type="text" value={currentTime} readOnly className="w-full p-3 bg-gray-200 rounded-xl" /></div>
            </div>
            <div className="flex gap-4 mt-6">
              <button onClick={() => setShowLoginModal(false)} className="flex-1 bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-400 transition">Cancel</button>
              <button onClick={() => { setConfirmType('login'); setShowLoginModal(false); setShowConfirmModal(true); }} className="flex-1 bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition">Save</button>
            </div>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-red-600 text-center">Logout Attendance</h2>
            <div className="space-y-4">
              <div><label className="font-semibold text-gray-700">Employee ID</label><input type="text" value={user?.employeeId || ''} readOnly className="w-full p-3 bg-gray-200 rounded-xl" /></div>
              <div><label className="font-semibold text-gray-700">Employee Name</label><input type="text" value={user?.name || ''} readOnly className="w-full p-3 bg-gray-200 rounded-xl" /></div>
              <div><label className="font-semibold text-gray-700">Date</label><input type="text" value={currentDate} readOnly className="w-full p-3 bg-gray-200 rounded-xl" /></div>
              <div><label className="font-semibold text-gray-700">Login Time</label><input type="text" value={loginTime || 'N/A'} readOnly className="w-full p-3 bg-gray-200 rounded-xl" /></div>
              <div><label className="font-semibold text-gray-700">Logout Time</label><input type="text" value={currentTime} readOnly className="w-full p-3 bg-gray-200 rounded-xl" /></div>
              <div><label className="font-semibold text-gray-700">Total Time Worked</label><input type="text" value={loginTime ? formatTimer(calculateWorkingHours(loginTime, currentTime)) : '0s'} readOnly className="w-full p-3 bg-gray-200 rounded-xl" /></div>
            </div>
            <div className="flex gap-4 mt-6">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-400 transition">Cancel</button>
              <button onClick={() => { setConfirmType('logout'); setShowLogoutModal(false); setShowConfirmModal(true); }} className="flex-1 bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-700 transition">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
            {confirmType === 'login' ? (
              <>
                <h2 className="text-2xl font-bold mb-6 text-green-600 text-center">Confirm Your Attendance</h2>
                <p className="text-center text-gray-700 mb-6">Are you sure you want to mark your login attendance?</p>
                <div className="flex gap-4">
                  <button onClick={() => setShowConfirmModal(false)} className="flex-1 bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-400 transition">Cancel</button>
                  <button onClick={handleLogin} className="flex-1 bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition">Confirm</button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-6 text-red-600 text-center">Logout Summary</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between"><span className="font-semibold">Login Time:</span><span>{loginTime}</span></div>
                  <div className="flex justify-between"><span className="font-semibold">Logout Time:</span><span>{currentTime}</span></div>
                  <div className="flex justify-between"><span className="font-semibold">Working Hours:</span><span>{loginTime ? formatTimer(calculateWorkingHours(loginTime, currentTime)) : '0s'}</span></div>
                </div>
                <button onClick={handleLogout} className="w-full bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-700 transition">Confirm Logout</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;