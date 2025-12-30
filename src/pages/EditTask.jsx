import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import { FiDownload, FiTrash2, FiFile } from "react-icons/fi";

const EditTask = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState({
    title: "",
    description: "",
    assignedTo: "",
    team: "",
    startDate: "",
    dueDate: "",
    estimatedHours: "",
    priority: "Medium",
    status: "Not Started",
    category: "Development",
    progress: 0,
    tags: "",
    notes: "",
    notifyAssignee: true
  });
  
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingError, setFetchingError] = useState("");
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [newAttachments, setNewAttachments] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const token = localStorage.getItem("token");
  
  // Create axios instance with auth header
  const api = axios.create({
    baseURL: "http://localhost:5000/api",
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  
  // Fetch ticket data and employees/teams
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch ticket data by ID
        const ticketRes = await api.get(`/tasks/${id}`);
        const ticketData = ticketRes.data;
        
        // Format dates for form inputs (YYYY-MM-DD format)
        const formattedTicket = {
          ...ticketData,
          startDate: ticketData.startDate ? new Date(ticketData.startDate).toISOString().split('T')[0] : "",
          dueDate: ticketData.dueDate ? new Date(ticketData.dueDate).toISOString().split('T')[0] : "",
          assignedTo: ticketData.assignedTo?._id || "",
          team: ticketData.team?._id || ""
        };
        
        setTicket(formattedTicket);
        setExistingAttachments(ticketData.attachments || []);
        setFetchingError("");
        
        // Fetch employees and teams
        const [employeesRes, teamsRes] = await Promise.all([
          api.get("/users"),
          api.get("/teams")
        ]);
        
        setEmployees(employeesRes.data || []);
        setTeams(teamsRes.data || []);
        setFilteredEmployees(employeesRes.data || []);
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setFetchingError("Failed to load ticket data");
        setToast({ show: true, message: 'Failed to load ticket data', type: 'error' });
        setLoading(false);
      }
    };
    
    if (id) {
      fetchData();
    }
  }, [id]);
  
  // Filter employees based on selected team
  useEffect(() => {
    if (ticket.team && teams.length > 0 && employees.length > 0) {
      const selectedTeam = teams.find(team => team._id === ticket.team);
      if (selectedTeam && selectedTeam.members) {
        const teamMemberIds = selectedTeam.members
          .map(member => {
            if (member.employee && typeof member.employee === 'object') {
              return member.employee._id || member.employee;
            }
            return member.employee;
          })
          .filter(Boolean);
        
        if (selectedTeam.team_leader) {
          const leaderId = typeof selectedTeam.team_leader === 'object' 
            ? selectedTeam.team_leader._id 
            : selectedTeam.team_leader;
          if (leaderId && !teamMemberIds.includes(leaderId)) {
            teamMemberIds.push(leaderId);
          }
        }
        
        const teamMembers = employees.filter(emp => 
          teamMemberIds.some(id => 
            id.toString() === emp._id.toString()
          )
        );
        setFilteredEmployees(teamMembers);
      } else {
        setFilteredEmployees(employees);
      }
    } else {
      setFilteredEmployees(employees);
    }
  }, [ticket.team, teams, employees]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTicket(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleFileChange = (e) => {
    setNewAttachments(e.target.files);
  };
  
  const handleDownloadAttachment = (attachment) => {
    // Create download link
    const link = document.createElement('a');
    link.href = `http://localhost:5000/${attachment.path}`;
    link.download = attachment.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleDeleteAttachment = async (attachmentId) => {
    try {
      await api.delete(`/tasks/${id}/attachments/${attachmentId}`);
      
      // Remove from local state
      setExistingAttachments(prev => prev.filter(att => att._id !== attachmentId));
      
      setToast({ show: true, message: 'Attachment deleted successfully', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Failed to delete attachment', type: 'error' });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add all ticket fields to FormData
      Object.keys(ticket).forEach(key => {
        if (key !== 'attachments') { // Don't include attachments in the main ticket data
          formData.append(key, ticket[key]);
        }
      });
      
      // Add new attachments if any
      if (newAttachments.length > 0) {
        for (let i = 0; i < newAttachments.length; i++) {
          formData.append('attachments', newAttachments[i]);
        }
      }
      
      // Add existing attachment IDs to keep
      const existingAttachmentIds = existingAttachments.map(att => att._id);
      formData.append('existingAttachments', JSON.stringify(existingAttachmentIds));
      
      // Send to API with proper headers for FormData
      await api.put(`/tasks/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setToast({ show: true, message: 'Ticket updated successfully!', type: 'success' });
      setTimeout(() => {
        navigate("/tasks");
      }, 1500);
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Failed to update ticket.', type: 'error' });
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-12 w-12 border-t-4 border-blue-600 rounded-full"></div>
        </div>
        <Footer />
      </div>
    );
  }
  
  if (fetchingError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-gray-700 mb-6">{fetchingError}</p>
            <button
              onClick={() => navigate("/tasks")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Back to Tasks
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col">
      <Navbar />
      
      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-extrabold text-blue-700 mb-6">Edit Ticket</h1>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6">
          {/* Core Ticket Information */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Ticket Information</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Ticket Title *</label>
              <input
                type="text"
                name="title"
                value={ticket.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={ticket.description}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>
          
          {/* Assignment */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Assignment</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Team</label>
                <select
                  name="team"
                  value={ticket.team}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Team</option>
                  {teams.map(team => (
                    <option key={team._id} value={team._id}>{team.team_name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Assigned To *</label>
                <select
                  name="assignedTo"
                  value={ticket.assignedTo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Employee</option>
                  {filteredEmployees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                  ))}
                </select>
                {ticket.team && filteredEmployees.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">No members found in selected team</p>
                )}
                {ticket.team && filteredEmployees.length > 0 && (
                  <p className="text-sm text-blue-600 mt-1">Showing team members only</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Time Management */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Time Management</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={ticket.startDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Due Date *</label>
                <input
                  type="date"
                  name="dueDate"
                  value={ticket.dueDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Estimated Hours</label>
                <input
                  type="number"
                  name="estimatedHours"
                  value={ticket.estimatedHours}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          
          {/* Ticket Properties */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Ticket Properties</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Priority</label>
                <select
                  name="priority"
                  value={ticket.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Status</label>
                <select
                  name="status"
                  value={ticket.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                  <option value="In Review">In Review</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Category</label>
                <select
                  name="category"
                  value={ticket.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Development">Development</option>
                  <option value="Design">Design</option>
                  <option value="Testing">Testing</option>
                  <option value="Documentation">Documentation</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Research">Research</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Additional Information */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Additional Information</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Tags</label>
              <input
                type="text"
                name="tags"
                value={ticket.tags}
                onChange={handleChange}
                placeholder="e.g., urgent, client, internal"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Notes</label>
              <textarea
                name="notes"
                value={ticket.notes}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>
          
          {/* Existing Attachments */}
          {existingAttachments.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Existing Attachments</h2>
              <div className="space-y-2">
                {existingAttachments.map((attachment, index) => (
                  <div key={attachment._id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FiFile className="text-blue-600" size={20} />
                      <div>
                        <p className="font-medium text-gray-800">{attachment.filename}</p>
                        <p className="text-sm text-gray-500">
                          Uploaded: {new Date(attachment.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadAttachment(attachment)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        title="Download"
                      >
                        <FiDownload size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(attachment._id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                        title="Delete"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* New Attachments */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {existingAttachments.length > 0 ? "Add More Attachments" : "Attachments"}
            </h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Upload Documents</label>
              <input
                type="file"
                onChange={handleFileChange}
                multiple
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">You can upload multiple documents</p>
            </div>
            
            {newAttachments.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700 mb-2">New Files:</p>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {Array.from(newAttachments).map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Notification Settings */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Notification Settings</h2>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="notifyAssignee"
                  checked={ticket.notifyAssignee}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-gray-700">Notify assignee when ticket is updated</span>
              </label>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate("/tasks")}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Update Ticket
            </button>
          </div>
        </form>
      </div>
      
      <Toast 
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />
      
      <Footer />
    </div>
  );
};

export default EditTask;