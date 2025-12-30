import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Toast from "../components/Toast";

const AddTask = () => {
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
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const navigate = useNavigate();
  
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
  
  // Fetch employees and teams from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch employees (users)
        const employeesRes = await api.get("/users");
        setEmployees(employeesRes.data || []);
        setFilteredEmployees(employeesRes.data || []);
        
        // Fetch teams with populated members
        const teamsRes = await api.get("/teams");
        setTeams(teamsRes.data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    
    fetchData();
  }, []);
  
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
    setTicket(prev => ({ ...prev, assignedTo: "" }));
  }, [ticket.team, teams, employees]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTicket(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleFileChange = (e) => {
    setAttachments(e.target.files);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setUploading(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add all ticket fields to FormData
      Object.keys(ticket).forEach(key => {
        formData.append(key, ticket[key]);
      });
      
      // Add attachments if any
      if (attachments.length > 0) {
        for (let i = 0; i < attachments.length; i++) {
          formData.append('attachments', attachments[i]);
        }
      }
      
      // Send to API with proper headers for FormData
      await api.post("/tasks", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setToast({ show: true, message: 'Ticket created successfully!', type: 'success' });
      setTimeout(() => {
        navigate("/tasks");
      }, 1500);
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Failed to create ticket.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col">
      <Navbar />
      
      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-extrabold text-blue-700 mb-6">Add New Ticket</h1>
        
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
          
          {/* Document Upload */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Attachments</h2>
            
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
            
            {attachments.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Selected Files:</p>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {Array.from(attachments).map((file, index) => (
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
                <span className="text-gray-700">Notify assignee when ticket is created</span>
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
              disabled={uploading}
            >
              {uploading ? "Creating..." : "Create Ticket"}
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

export default AddTask;









// // AddTask.jsx
// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import Navbar from "../components/Navbar";
// import Footer from "../components/Footer";
// import Toast from "../components/Toast";

// const AddTicket = () => {
//   const [ticket, setTicket] = useState({
//     title: "",
//     description: "",
//     assignedTo: "",
//     team: "",
//     startDate: "",
//     dueDate: "",
//     estimatedHours: "",
//     priority: "Medium",
//     status: "Not Started",
//     category: "Development",
//     progress: 0,
//     dependencies: [],
//     tags: "",
//     notes: "",
//     notifyAssignee: true
//   });
  
//   const [attachments, setAttachments] = useState([]);
//   const [employees, setEmployees] = useState([]);
//   const [teams, setTeams] = useState([]);
//   const [filteredEmployees, setFilteredEmployees] = useState([]);
//   const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
//   const token = localStorage.getItem("token");
  
//   // Fetch employees and teams from API
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         // Fetch employees (users)
//         const employeesRes = await axios.get("http://localhost:5000/api/users", {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         setEmployees(employeesRes.data || []);
//         setFilteredEmployees(employeesRes.data || []);
        
//         // Fetch teams with populated members
//         const teamsRes = await axios.get("http://localhost:5000/api/teams", {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         setTeams(teamsRes.data || []);
//       } catch (err) {
//         console.error("Error fetching data:", err);
//       }
//     };
    
//     fetchData();
//   }, [token]);
  
//   // Filter employees based on selected team
//   useEffect(() => {
//     if (ticket.team && teams.length > 0 && employees.length > 0) {
//       const selectedTeam = teams.find(team => team._id === ticket.team);
//       if (selectedTeam && selectedTeam.members) {
//         const teamMemberIds = selectedTeam.members
//           .map(member => {
//             if (member.employee && typeof member.employee === 'object') {
//               return member.employee._id || member.employee;
//             }
//             return member.employee;
//           })
//           .filter(Boolean);
        
//         if (selectedTeam.team_leader) {
//           const leaderId = typeof selectedTeam.team_leader === 'object' 
//             ? selectedTeam.team_leader._id 
//             : selectedTeam.team_leader;
//           if (leaderId && !teamMemberIds.includes(leaderId)) {
//             teamMemberIds.push(leaderId);
//           }
//         }
        
//         const teamMembers = employees.filter(emp => 
//           teamMemberIds.some(id => 
//             id.toString() === emp._id.toString()
//           )
//         );
//         setFilteredEmployees(teamMembers);
//       } else {
//         setFilteredEmployees(employees);
//       }
//     } else {
//       setFilteredEmployees(employees);
//     }
//     setTicket(prev => ({ ...prev, assignedTo: "" }));
//   }, [ticket.team, teams, employees]);
  
//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setTicket(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value
//     }));
//   };
  
//   const handleFileChange = (e) => {
//     setAttachments(e.target.files);
//   };
  
//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     // Create a plain object instead of FormData for now
//     const ticketData = {
//       title: ticket.title,
//       description: ticket.description,
//       assignedTo: ticket.assignedTo,
//       team: ticket.team || null, // Send null if no team is selected
//       startDate: ticket.startDate,
//       dueDate: ticket.dueDate,
//       estimatedHours: ticket.estimatedHours,
//       priority: ticket.priority,
//       status: ticket.status,
//       category: ticket.category,
//       progress: ticket.progress,
//       tags: ticket.tags,
//       notes: ticket.notes,
//       notifyAssignee: ticket.notifyAssignee
//     };
    
//     try {
//       // Send to API
//       await axios.post("http://localhost:5000/api/tasks", ticketData, {
//         headers: { 
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });
      
//       setToast({ show: true, message: 'Ticket created successfully!', type: 'success' });
//       setTimeout(() => {
//         window.location.href = "/tasks";
//       }, 1500);
//     } catch (err) {
//       console.error(err);
//       setToast({ show: true, message: 'Failed to create ticket.', type: 'error' });
//     }
//   };
  
//   return (
//     <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col">
//       <Navbar />
      
//       <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
//         <h1 className="text-3xl font-extrabold text-blue-700 mb-6">Add New Ticket</h1>
        
//         <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6">
//           {/* Core Task Information */}
//           <div className="mb-6">
//             <h2 className="text-xl font-semibold text-gray-800 mb-4">Ticket Information</h2>
            
//             <div className="mb-4">
//               <label className="block text-gray-700 font-medium mb-2">Ticket Title *</label>
//               <input
//                 type="text"
//                 name="title"
//                 value={ticket.title}
//                 onChange={handleChange}
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//             </div>
            
//             <div className="mb-4">
//               <label className="block text-gray-700 font-medium mb-2">Description</label>
//               <textarea
//                 name="description"
//                 value={ticket.description}
//                 onChange={handleChange}
//                 rows="4"
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               ></textarea>
//             </div>
//           </div>
          
//           {/* Assignment */}
//           <div className="mb-6">
//             <h2 className="text-xl font-semibold text-gray-800 mb-4">Assignment</h2>
            
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
//               <div className="mb-4">
//                 <label className="block text-gray-700 font-medium mb-2">Team</label>
//                 <select
//                   name="team"
//                   value={ticket.team}
//                   onChange={handleChange}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="">Select Team</option>
//                   {teams.map(team => (
//                     <option key={team._id} value={team._id}>{team.team_name}</option>
//                   ))}
//                 </select>
//               </div>
//                <div className="mb-4">
//                 <label className="block text-gray-700 font-medium mb-2">Assigned To *</label>
//                 <select
//                   name="assignedTo"
//                   value={ticket.assignedTo}
//                   onChange={handleChange}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   required
//                 >
//                   <option value="">Select Employee</option>
//                   {filteredEmployees.map(emp => (
//                     <option key={emp._id} value={emp._id}>{emp.name}</option>
//                   ))}
//                 </select>
//                 {ticket.team && filteredEmployees.length === 0 && (
//                   <p className="text-sm text-gray-500 mt-1">No members found in selected team</p>
//                 )}
//                 {ticket.team && filteredEmployees.length > 0 && (
//                   <p className="text-sm text-blue-600 mt-1">Showing team members only</p>
//                 )}
//               </div>
//             </div>
//           </div>
          
//           {/* Time Management */}
//           <div className="mb-6">
//             <h2 className="text-xl font-semibold text-gray-800 mb-4">Time Management</h2>
            
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="mb-4">
//                 <label className="block text-gray-700 font-medium mb-2">Start Date</label>
//                 <input
//                   type="date"
//                   name="startDate"
//                   value={ticket.startDate}
//                   onChange={handleChange}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
              
//               <div className="mb-4">
//                 <label className="block text-gray-700 font-medium mb-2">Due Date *</label>
//                 <input
//                   type="date"
//                   name="dueDate"
//                   value={ticket.dueDate}
//                   onChange={handleChange}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   required
//                 />
//               </div>
              
//               <div className="mb-4">
//                 <label className="block text-gray-700 font-medium mb-2">Estimated Hours</label>
//                 <input
//                   type="number"
//                   name="estimatedHours"
//                   value={ticket.estimatedHours}
//                   onChange={handleChange}
//                   min="0"
//                   step="0.5"
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//             </div>
//           </div>
          
//           {/* Task Properties */}
//           <div className="mb-6">
//             <h2 className="text-xl font-semibold text-gray-800 mb-4">Ticket Properties</h2>
            
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="mb-4">
//                 <label className="block text-gray-700 font-medium mb-2">Priority</label>
//                 <select
//                   name="priority"
//                   value={ticket.priority}
//                   onChange={handleChange}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="Low">Low</option>
//                   <option value="Medium">Medium</option>
//                   <option value="High">High</option>
//                   <option value="Critical">Critical</option>
//                 </select>
//               </div>
              
//               <div className="mb-4">
//                 <label className="block text-gray-700 font-medium mb-2">Status</label>
//                 <select
//                   name="status"
//                   value={ticket.status}
//                   onChange={handleChange}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="Not Started">Not Started</option>
//                   <option value="In Progress">In Progress</option>
//                   <option value="On Hold">On Hold</option>
//                   <option value="Completed">Completed</option>
//                   <option value="In Review">In Review</option>
//                 </select>
//               </div>
              
//               <div className="mb-4">
//                 <label className="block text-gray-700 font-medium mb-2">Category</label>
//                 <select
//                   name="category"
//                   value={ticket.category}
//                   onChange={handleChange}
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 >
//                   <option value="Development">Development</option>
//                   <option value="Design">Design</option>
//                   <option value="Testing">Testing</option>
//                   <option value="Documentation">Documentation</option>
//                   <option value="Meeting">Meeting</option>
//                   <option value="Research">Research</option>
//                 </select>
//               </div>
//             </div>
//           </div>
          
//           {/* Additional Information */}
//           <div className="mb-6">
//             <h2 className="text-xl font-semibold text-gray-800 mb-4">Additional Information</h2>
            
//             <div className="mb-4">
//               <label className="block text-gray-700 font-medium mb-2">Tags</label>
//               <input
//                 type="text"
//                 name="tags"
//                 value={ticket.tags}
//                 onChange={handleChange}
//                 placeholder="e.g., urgent, client, internal"
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
            
//             <div className="mb-4">
//               <label className="block text-gray-700 font-medium mb-2">Notes</label>
//               <textarea
//                 name="notes"
//                 value={ticket.notes}
//                 onChange={handleChange}
//                 rows="3"
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               ></textarea>
//             </div>
            
//             <div className="mb-4">
//               <label className="block text-gray-700 font-medium mb-2">Attachments</label>
//               <input
//                 type="file"
//                 onChange={handleFileChange}
//                 multiple
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//           </div>
          
//           {/* Notification Settings */}
//           <div className="mb-6">
//             <h2 className="text-xl font-semibold text-gray-800 mb-4">Notification Settings</h2>
            
//             <div className="mb-4">
//               <label className="flex items-center">
//                 <input
//                   type="checkbox"
//                   name="notifyAssignee"
//                   checked={ticket.notifyAssignee}
//                   onChange={handleChange}
//                   className="mr-2"
//                 />
//                 <span className="text-gray-700">Notify assignee when ticket is created</span>
//               </label>
//             </div>
//           </div>
          
//           {/* Form Actions */}
//           <div className="flex justify-end gap-4">
//             <button
//               type="button"
//               onClick={() => window.location.href = "/tasks"}
//               className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
//             >
//               Create Ticket
//             </button>
//           </div>
//         </form>
//       </div>
      
//       <Toast 
//         message={toast.message}
//         type={toast.type}
//         isVisible={toast.show}
//         onClose={() => setToast({ ...toast, show: false })}
//       />
      
//       <Footer />
//     </div>
//   );
// };

// export default AddTicket;













// // // AddTask.jsx
// // import React, { useState, useEffect } from "react";
// // import axios from "axios";
// // import Navbar from "../components/Navbar";
// // import Footer from "../components/Footer";
// // import Toast from "../components/Toast";

// // const AddTicket = () => {
// //   const [ticket, setTicket] = useState({
// //     title: "",
// //     description: "",
// //     assignedTo: "",
// //     team: "",
// //     startDate: "",
// //     dueDate: "",
// //     estimatedHours: "",
// //     priority: "Medium",
// //     status: "Not Started",
// //     category: "Development",
// //     progress: 0,
// //     dependencies: [],
// //     tags: "",
// //     notes: "",
// //     notifyAssignee: true
// //   });
  
// //   const [attachments, setAttachments] = useState([]);
// //   const [employees, setEmployees] = useState([]);
// //   const [teams, setTeams] = useState([]);
// //   const [filteredEmployees, setFilteredEmployees] = useState([]);
// //   const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
// //   const token = localStorage.getItem("token");
  
// //   // Fetch employees and teams from API
// //   useEffect(() => {
// //     const fetchData = async () => {
// //       try {
// //         // Fetch employees (users)
// //         const employeesRes = await axios.get("http://localhost:5000/api/users", {
// //           headers: { Authorization: `Bearer ${token}` }
// //         });
// //         setEmployees(employeesRes.data || []);
// //         setFilteredEmployees(employeesRes.data || []);
        
// //         // Fetch teams with populated members
// //         const teamsRes = await axios.get("http://localhost:5000/api/teams", {
// //           headers: { Authorization: `Bearer ${token}` }
// //         });
// //         setTeams(teamsRes.data || []);
// //       } catch (err) {
// //         console.error("Error fetching data:", err);
// //       }
// //     };
    
// //     fetchData();
// //   }, [token]);
  
// //   // Filter employees based on selected team
// //   useEffect(() => {
// //     if (ticket.team && teams.length > 0 && employees.length > 0) {
// //       const selectedTeam = teams.find(team => team._id === ticket.team);
// //       if (selectedTeam && selectedTeam.members) {
// //         // Extract member IDs - handle both populated and unpopulated cases
// //         const teamMemberIds = selectedTeam.members
// //           .map(member => {
// //             // If employee is populated, use _id, otherwise use the employee field directly
// //             if (member.employee && typeof member.employee === 'object') {
// //               return member.employee._id || member.employee;
// //             }
// //             return member.employee; // It's already an ID
// //           })
// //           .filter(Boolean); // Remove any undefined/null values
        
// //         // Include team leader as well
// //         if (selectedTeam.team_leader) {
// //           const leaderId = typeof selectedTeam.team_leader === 'object' 
// //             ? selectedTeam.team_leader._id 
// //             : selectedTeam.team_leader;
// //           if (leaderId && !teamMemberIds.includes(leaderId)) {
// //             teamMemberIds.push(leaderId);
// //           }
// //         }
        
// //         // Filter employees to show only team members
// //         const teamMembers = employees.filter(emp => 
// //           teamMemberIds.some(id => 
// //             id.toString() === emp._id.toString()
// //           )
// //         );
// //         setFilteredEmployees(teamMembers);
// //       } else {
// //         // Team not found or has no members, show all employees
// //         setFilteredEmployees(employees);
// //       }
// //     } else {
// //       // No team selected, show all employees
// //       setFilteredEmployees(employees);
// //     }
// //     // Reset assignedTo when team changes
// //     setTicket(prev => ({ ...prev, assignedTo: "" }));
// //   }, [ticket.team, teams, employees]);
  
// //   const handleChange = (e) => {
// //     const { name, value, type, checked } = e.target;
// //     setTicket(prev => ({
// //       ...prev,
// //       [name]: type === 'checkbox' ? checked : value
// //     }));
// //   };
  
// //   const handleFileChange = (e) => {
// //     setAttachments(e.target.files);
// //   };
  
// //   const handleSubmit = (e) => {
// //     e.preventDefault();
    
// //     const formData = new FormData();
    
// //     // Add all ticket fields to formData
// //     Object.keys(ticket).forEach(key => {
// //       if (Array.isArray(ticket[key])) {
// //         ticket[key].forEach(item => formData.append(key, item));
// //       } else {
// //         formData.append(key, ticket[key]);
// //       }
// //     });
    
// //     // Add attachments
// //     Array.from(attachments).forEach(file => {
// //       formData.append('attachments', file);
// //     });
    
// //     // Send to API
// //     axios.post("http://localhost:5000/api/tasks", formData)
// //       .then(res => {
// //         setToast({ show: true, message: 'Ticket created successfully!', type: 'success' });
// //         setTimeout(() => {
// //           window.location.href = "/tasks";
// //         }, 1500);
// //       })
// //       .catch(err => {
// //         console.error(err);
// //         setToast({ show: true, message: 'Failed to create ticket.', type: 'error' });
// //       });
// //   };
  
// //   return (
// //     <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col">
// //       <Navbar />
      
// //       <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
// //         <h1 className="text-3xl font-extrabold text-blue-700 mb-6">Add New Ticket</h1>
        
// //         <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6">
// //           {/* Core Task Information */}
// //           <div className="mb-6">
// //             <h2 className="text-xl font-semibold text-gray-800 mb-4">Ticket Information</h2>
            
// //             <div className="mb-4">
// //               <label className="block text-gray-700 font-medium mb-2">Ticket Title *</label>
// //               <input
// //                 type="text"
// //                 name="title"
// //                 value={ticket.title}
// //                 onChange={handleChange}
// //                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 required
// //               />
// //             </div>
            
// //             <div className="mb-4">
// //               <label className="block text-gray-700 font-medium mb-2">Description</label>
// //               <textarea
// //                 name="description"
// //                 value={ticket.description}
// //                 onChange={handleChange}
// //                 rows="4"
// //                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
// //               ></textarea>
// //             </div>
// //           </div>
          
// //           {/* Assignment */}
// //           <div className="mb-6">
// //             <h2 className="text-xl font-semibold text-gray-800 mb-4">Assignment</h2>
            
// //             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
// //               <div className="mb-4">
// //                 <label className="block text-gray-700 font-medium mb-2">Team</label>
// //                 <select
// //                   name="team"
// //                   value={ticket.team}
// //                   onChange={handleChange}
// //                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 >
// //                   <option value="">Select Team</option>
// //                   {teams.map(team => (
// //                     <option key={team._id} value={team._id}>{team.team_name}</option>
// //                   ))}
// //                 </select>
// //               </div>
// //                <div className="mb-4">
// //                 <label className="block text-gray-700 font-medium mb-2">Assigned To *</label>
// //                 <select
// //                   name="assignedTo"
// //                   value={ticket.assignedTo}
// //                   onChange={handleChange}
// //                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                   required
// //                 >
// //                   <option value="">Select Employee</option>
// //                   {filteredEmployees.map(emp => (
// //                     <option key={emp._id} value={emp._id}>{emp.name}</option>
// //                   ))}
// //                 </select>
// //                 {ticket.team && filteredEmployees.length === 0 && (
// //                   <p className="text-sm text-gray-500 mt-1">No members found in selected team</p>
// //                 )}
// //                 {ticket.team && filteredEmployees.length > 0 && (
// //                   <p className="text-sm text-blue-600 mt-1">Showing team members only</p>
// //                 )}
// //               </div>
// //             </div>
// //           </div>
          
// //           {/* Time Management */}
// //           <div className="mb-6">
// //             <h2 className="text-xl font-semibold text-gray-800 mb-4">Time Management</h2>
            
// //             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //               <div className="mb-4">
// //                 <label className="block text-gray-700 font-medium mb-2">Start Date</label>
// //                 <input
// //                   type="date"
// //                   name="startDate"
// //                   value={ticket.startDate}
// //                   onChange={handleChange}
// //                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 />
// //               </div>
              
// //               <div className="mb-4">
// //                 <label className="block text-gray-700 font-medium mb-2">Due Date *</label>
// //                 <input
// //                   type="date"
// //                   name="dueDate"
// //                   value={ticket.dueDate}
// //                   onChange={handleChange}
// //                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                   required
// //                 />
// //               </div>
              
// //               <div className="mb-4">
// //                 <label className="block text-gray-700 font-medium mb-2">Estimated Hours</label>
// //                 <input
// //                   type="number"
// //                   name="estimatedHours"
// //                   value={ticket.estimatedHours}
// //                   onChange={handleChange}
// //                   min="0"
// //                   step="0.5"
// //                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 />
// //               </div>
// //             </div>
// //           </div>
          
// //           {/* Task Properties */}
// //           <div className="mb-6">
// //             <h2 className="text-xl font-semibold text-gray-800 mb-4">Ticket Properties</h2>
            
// //             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //               <div className="mb-4">
// //                 <label className="block text-gray-700 font-medium mb-2">Priority</label>
// //                 <select
// //                   name="priority"
// //                   value={ticket.priority}
// //                   onChange={handleChange}
// //                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 >
// //                   <option value="Low">Low</option>
// //                   <option value="Medium">Medium</option>
// //                   <option value="High">High</option>
// //                   <option value="Critical">Critical</option>
// //                 </select>
// //               </div>
              
// //               <div className="mb-4">
// //                 <label className="block text-gray-700 font-medium mb-2">Status</label>
// //                 <select
// //                   name="status"
// //                   value={ticket.status}
// //                   onChange={handleChange}
// //                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 >
// //                   <option value="Not Started">Not Started</option>
// //                   <option value="In Progress">In Progress</option>
// //                   <option value="On Hold">On Hold</option>
// //                   <option value="Completed">Completed</option>
// //                   <option value="In Review">In Review</option>
// //                 </select>
// //               </div>
              
// //               <div className="mb-4">
// //                 <label className="block text-gray-700 font-medium mb-2">Category</label>
// //                 <select
// //                   name="category"
// //                   value={ticket.category}
// //                   onChange={handleChange}
// //                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                 >
// //                   <option value="Development">Development</option>
// //                   <option value="Design">Design</option>
// //                   <option value="Testing">Testing</option>
// //                   <option value="Documentation">Documentation</option>
// //                   <option value="Meeting">Meeting</option>
// //                   <option value="Research">Research</option>
// //                 </select>
// //               </div>
              
// //               {/* <div className="mb-4">
// //                 <label className="block text-gray-700 font-medium mb-2">Progress ({task.progress}%)</label>
// //                 <input
// //                   type="range"
// //                   name="progress"
// //                   value={task.progress}
// //                   onChange={handleChange}
// //                   min="0"
// //                   max="100"
// //                   step="5"
// //                   className="w-full"
// //                 />
// //               </div> */}
// //             </div>
// //           </div>
          
// //           {/* Additional Information */}
// //           <div className="mb-6">
// //             <h2 className="text-xl font-semibold text-gray-800 mb-4">Additional Information</h2>
            
// //             <div className="mb-4">
// //               <label className="block text-gray-700 font-medium mb-2">Tags</label>
// //               <input
// //                 type="text"
// //                 name="tags"
// //                 value={ticket.tags}
// //                 onChange={handleChange}
// //                 placeholder="e.g., urgent, client, internal"
// //                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
// //               />
// //             </div>
            
// //             <div className="mb-4">
// //               <label className="block text-gray-700 font-medium mb-2">Notes</label>
// //               <textarea
// //                 name="notes"
// //                 value={ticket.notes}
// //                 onChange={handleChange}
// //                 rows="3"
// //                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
// //               ></textarea>
// //             </div>
            
// //             <div className="mb-4">
// //               <label className="block text-gray-700 font-medium mb-2">Attachments</label>
// //               <input
// //                 type="file"
// //                 onChange={handleFileChange}
// //                 multiple
// //                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
// //               />
// //             </div>
// //           </div>
          
// //           {/* Notification Settings */}
// //           <div className="mb-6">
// //             <h2 className="text-xl font-semibold text-gray-800 mb-4">Notification Settings</h2>
            
// //             <div className="mb-4">
// //               <label className="flex items-center">
// //                 <input
// //                   type="checkbox"
// //                   name="notifyAssignee"
// //                   checked={ticket.notifyAssignee}
// //                   onChange={handleChange}
// //                   className="mr-2"
// //                 />
// //                 <span className="text-gray-700">Notify assignee when ticket is created</span>
// //               </label>
// //             </div>
// //           </div>
          
// //           {/* Form Actions */}
// //           <div className="flex justify-end gap-4">
// //             <button
// //               type="button"
// //               onClick={() => window.location.href = "/tasks"}
// //               className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
// //             >
// //               Cancel
// //             </button>
// //             <button
// //               type="submit"
// //               className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
// //             >
// //               Create Ticket
// //             </button>
// //           </div>
// //         </form>
// //       </div>
      
// //       <Toast 
// //         message={toast.message}
// //         type={toast.type}
// //         isVisible={toast.show}
// //         onClose={() => setToast({ ...toast, show: false })}
// //       />
      
// //       <Footer />
// //     </div>
// //   );
// // };

// // export default AddTicket;