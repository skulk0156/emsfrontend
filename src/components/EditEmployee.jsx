import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from './Footer';
import Navbar from './Navbar';

const departments = [
  "Engineering",
  "HR",
  "Finance",
  "Marketing",
  "Sales",
  "Operations",
  "IT Support",
  "Customer Service",
  "Logistics",
  "Legal",
  "Procurement",
  "R&D",
  "Quality",
  "Admin",
  "Production",
  "Maintenance",
  "Design",
  "Training",
  "Compliance",
  "Analytics",
  "Strategy",
  "Security",
  "Public Relations",
  "Facilities",
  "Health & Safety",
  "UX/UI",
  "Data Science",
  "Content",
  "Business Development",
  "Innovation"
];

const designations = [
  "Manager",
  "Senior Engineer",
  "Junior Engineer",
  "Intern",
  "Team Lead",
  "HR Executive",
  "Finance Analyst",
  "Marketing Specialist",
  "Sales Associate",
  "Operations Manager",
  "IT Support Engineer",
  "Customer Support Rep",
  "Logistics Coordinator",
  "Legal Advisor",
  "Procurement Officer",
  "R&D Scientist",
  "Quality Analyst",
  "Admin Assistant",
  "Production Supervisor",
  "Maintenance Technician",
  "Designer",
  "Trainer",
  "Compliance Officer",
  "Data Analyst",
  "Strategy Consultant",
  "Security Officer",
  "PR Executive",
  "Facilities Manager",
  "Safety Officer",
  "Content Writer",
  "Business Developer",
  "Innovation Lead",
  "UX Designer",
  "UI Designer",
  "Data Engineer",
  "Product Manager",
  "Software Engineer",
  "Network Engineer",
  "Cloud Engineer",
  "DevOps Engineer",
  "Database Admin",
  "AI Specialist",
  "Machine Learning Engineer",
  "Cybersecurity Analyst",
  "Marketing Manager",
  "Sales Manager",
  "Operations Executive",
  "HR Manager",
  "Finance Manager",
  "Legal Manager",
  "Customer Success Manager"
];

// Role options for dropdown
const roles = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "hr", label: "HR" },
  { value: "employee", label: "Employee" }
];

// Create an axios instance with default headers
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', 
    email: '', 
    role: '', 
    department: '', 
    designation: '', 
    phone: '', 
    joining_date: '', 
    dob: '',
    location: '',
    address: '',
    gender: '',
    password: '' // Add password field
  });
  const [profileImage, setProfileImage] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await api.get(`/users/${id}`);
        const data = res.data;
        setFormData({
          name: data.name || '',
          email: data.email || '',
          role: data.role || '',
          department: data.department || '',
          designation: data.designation || '',
          phone: data.phone || '',
          joining_date: data.joining_date?.slice(0, 10) || '',
          dob: data.dob?.slice(0, 10) || '',
          location: data.location || '',
          address: data.address || '',
          gender: data.gender || '',
          password: '' // Don't populate password field
        });
        setProfileImage(data.profileImage || '');
        setLoading(false);
      } catch (err) {
        console.error(err);
        if (err.response && err.response.status === 401) {
          setError('You are not authorized to view this page. Please log in again.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError('Failed to load employee data');
        }
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Show confirmation modal
  const handleConfirmUpdate = (e) => {
    e.preventDefault();
    setShowModal(true);
  };

  // Actual submit
  const handleSubmit = async () => {
    setSubmitting(true);
    
    // Create a new FormData object
    const payload = new FormData();
    
    // Append all form fields
    Object.keys(formData).forEach(key => {
      // Only append if the field has a value or if it's the password field (which can be empty)
      if (formData[key] !== null && formData[key] !== undefined) {
        payload.append(key, formData[key]);
      }
    });
    
    // Append file if selected
    if (file) {
      payload.append('profileImage', file);
    }

    // Debug: Log FormData contents
    console.log('=== SUBMITTING FORM ===');
    console.log('Form data:', formData);
    console.log('Selected file:', file);
    console.log('FormData contents:');
    for (let pair of payload.entries()) {
      console.log(pair[0] + ': ' + (pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]));
    }

    try {
      console.log('Sending update request...');
      const response = await api.put(`/users/${id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log('Update response:', response.data);
      setNotification({ message: 'Employee updated successfully!', type: 'success' });
      setShowModal(false);
      setSubmitting(false);
      setTimeout(() => navigate('/employees'), 1500);
    } catch (err) {
      console.error('Update Error:', err);
      console.error('Error response:', err.response);
      
      if (err.response && err.response.status === 401) {
        setNotification({ message: 'You are not authorized to update this employee. Please log in again.', type: 'error' });
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response && err.response.data) {
        // Handle specific error messages from the backend
        if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
          setNotification({ 
            message: `Validation errors: ${err.response.data.errors.join(', ')}`, 
            type: 'error' 
          });
        } else {
          setNotification({ message: err.response.data.message || 'Failed to update employee.', type: 'error' });
        }
      } else {
        setNotification({ message: 'Failed to update employee. Please try again.', type: 'error' });
      }
      setShowModal(false);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-blue-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl text-blue-700">Loading employee data...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-blue-50">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-blue-700 mb-6 text-center">Edit Employee</h2>

          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
          {notification.message && (
            <div
              className={`mb-4 text-center px-4 py-2 rounded ${
                notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {notification.message}
            </div>
          )}

          <form onSubmit={handleConfirmUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="flex flex-col">
              <label className="mb-1 font-semibold text-gray-700">Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter name"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            {/* Email */}
            <div className="flex flex-col">
              <label className="mb-1 font-semibold text-gray-700">Email</label>
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            {/* Role - Updated to Dropdown */}
            <div className="flex flex-col">
              <label className="mb-1 font-semibold text-gray-700">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              >
                <option value="">Select Role</option>
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div className="flex flex-col">
              <label className="mb-1 font-semibold text-gray-700">Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              >
                <option value="">Select Department</option>
                {departments.map((dept, index) => (
                  <option key={index} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Designation */}
            <div className="flex flex-col">
              <label className="mb-1 font-semibold text-gray-700">Designation</label>
              <select
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              >
                <option value="">Select Designation</option>
                {designations.map((desig, index) => (
                  <option key={index} value={desig}>{desig}</option>
                ))}
              </select>
            </div>

            {/* Phone */}
            <div className="flex flex-col">
              <label className="mb-1 font-semibold text-gray-700">Phone</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            {/* Joining Date */}
            <div className="flex flex-col">
              <label className="mb-1 font-semibold text-gray-700">Joining Date</label>
              <input
                type="date"
                name="joining_date"
                value={formData.joining_date}
                onChange={handleChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* DOB */}
            <div className="flex flex-col">
              <label className="mb-1 font-semibold text-gray-700">Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Location */}
            <div className="flex flex-col">
              <label className="mb-1 font-semibold text-gray-700">Location</label>
              <input
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter location"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Address */}
            <div className="flex flex-col">
              <label className="mb-1 font-semibold text-gray-700">Address</label>
              <input
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter address"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Gender */}
            <div className="flex flex-col">
              <label className="mb-1 font-semibold text-gray-700">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Password */}
            <div className="flex flex-col">
              <label className="mb-1 font-semibold text-gray-700">Password (leave blank to keep current)</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter new password"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Profile Image */}
            <div className="flex flex-col md:col-span-2">
              <label className="mb-1 font-semibold text-gray-700">Profile Image</label>
              <input type="file" onChange={handleFileChange} className="mb-2" />
              {profileImage && (
                <img
                  src={`http://localhost:5000/${profileImage}`}
                  alt="Profile"
                  className="w-32 h-32 object-cover rounded-full border border-gray-300"
                />
              )}
            </div>
          </form>

          {/* Update Button */}
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={handleConfirmUpdate}
              disabled={submitting}
              className={`font-semibold px-6 py-3 rounded-lg shadow-md transition ${
                submitting 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {submitting ? 'Updating...' : 'Update Employee'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/employees')}
              disabled={submitting}
              className={`font-semibold px-6 py-3 rounded-lg border-2 transition ${
                submitting 
                  ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed' 
                  : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50'
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-11/12 max-w-md">
            <h3 className="text-xl font-bold mb-4 text-center text-blue-700">Confirm Update</h3>
            <p className="text-gray-700 mb-6 text-center">Are you sure you want to update this employee's information?</p>
            <div className="flex justify-around">
              <button
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className={`px-4 py-2 rounded-lg border transition ${
                  submitting 
                    ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed' 
                    : 'border-gray-300 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={`px-4 py-2 rounded-lg transition ${
                  submitting 
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {submitting ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default EditEmployee;