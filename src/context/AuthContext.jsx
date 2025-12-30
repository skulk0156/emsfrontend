// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import Navbar from '../components/Navbar';
// Create the context
const AuthContext = createContext();
<Navbar />
// Create the provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginTime, setLoginTime] = useState('');
  const [attendanceRecord, setAttendanceRecord] = useState(null);
  const [logoutTime, setLogoutTime] = useState('');

  // This effect runs once on app startup to load state from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) setUser(JSON.parse(storedUser));

      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      setIsLoggedIn(loggedIn);

      const storedLoginTime = localStorage.getItem('attendanceLoginTime');
      if (storedLoginTime) setLoginTime(storedLoginTime);

      const storedRecord = localStorage.getItem('attendanceRecord');
      if (storedRecord) setAttendanceRecord(JSON.parse(storedRecord));

      const storedLogoutTime = localStorage.getItem('attendanceLogoutTime');
      if (storedLogoutTime) setLogoutTime(storedLogoutTime);

    } catch (error) {
      console.error("Failed to load auth state from localStorage:", error);
      // Clear potentially corrupted data
      clearAuthState();
    }
  }, []);

  // This effect runs whenever the user state changes to sync with localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      // Only remove user if the app is not in a "logged in" state
      if (!isLoggedIn) {
        localStorage.removeItem('user');
      }
    }
  }, [user, isLoggedIn]);

  // This effect runs whenever isLoggedIn changes to sync with localStorage
  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem('isLoggedIn', 'true');
    } else {
      localStorage.removeItem('isLoggedIn');
    }
  }, [isLoggedIn]);

  // This effect runs whenever loginTime changes to sync with localStorage
  useEffect(() => {
    if (loginTime) {
      localStorage.setItem('attendanceLoginTime', loginTime);
    } else {
      localStorage.removeItem('attendanceLoginTime');
    }
  }, [loginTime]);

  // This effect runs whenever attendanceRecord changes to sync with localStorage
  useEffect(() => {
    if (attendanceRecord) {
      localStorage.setItem('attendanceRecord', JSON.stringify(attendanceRecord));
    } else {
      localStorage.removeItem('attendanceRecord');
    }
  }, [attendanceRecord]);

  // This effect runs whenever logoutTime changes to sync with localStorage
  useEffect(() => {
    if (logoutTime) {
      localStorage.setItem('attendanceLogoutTime', logoutTime);
    } else {
      localStorage.removeItem('attendanceLogoutTime');
    }
  }, [logoutTime]);

  // Function to clear all auth-related state and localStorage
  const clearAuthState = () => {
    setUser(null);
    setIsLoggedIn(false);
    setLoginTime('');
    setAttendanceRecord(null);
    setLogoutTime('');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('attendanceLoginTime');
    localStorage.removeItem('attendanceRecord');
    localStorage.removeItem('attendanceLogoutTime');
  };

  // Value object to be provided to consuming components
  const value = {
    user,
    isLoggedIn,
    loginTime,
    attendanceRecord,
    logoutTime,
    setUser,
    setIsLoggedIn,
    setLoginTime,
    setAttendanceRecord,
    setLogoutTime,
    clearAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to easily use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};