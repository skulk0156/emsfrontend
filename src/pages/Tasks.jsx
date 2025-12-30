import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import { FiMoreVertical, FiClock, FiUser, FiCalendar, FiEye, FiX, FiEdit, FiTrash2, FiCheck } from "react-icons/fi";

const statusColors = {
  "Not Started": "bg-gray-500",
  "In Progress": "bg-blue-500",
  "On Hold": "bg-yellow-500",
  Completed: "bg-green-500",
  "In Review": "bg-purple-500",
  Pending: "bg-yellow-500",
};

const priorityColors = {
  Low: "bg-green-100 text-green-800",
  Medium: "bg-yellow-100 text-yellow-800", 
  High: "bg-orange-100 text-orange-800",
  Critical: "bg-red-100 text-red-800",
};

const Task = () => {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewTicket, setViewTicket] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [selectedTicketForProgress, setSelectedTicketForProgress] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [userRole, setUserRole] = useState("");
  
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

  useEffect(() => {
    setUserRole((localStorage.getItem("role") || "").toLowerCase());
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await api.get("/tasks");
      setTickets(response.data);
      setFilteredTickets(response.data);
      } catch (err) {
      console.error("Error fetching tickets:", err);
      setToast({ show: true, message: "Failed to load tickets", type: "error" });
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (!search) setFilteredTickets(tickets);
    else {
      const searchLower = search.toLowerCase();
      setFilteredTickets(
        tickets.filter(
          (ticket) =>
            ticket.title?.toLowerCase().includes(searchLower) ||
            String(ticket.taskId || "").toLowerCase().includes(searchLower) ||
            ticket.assignedTo?.name?.toLowerCase().includes(searchLower)
        )
      );
    }
  }, [search, tickets]);

  const confirmDelete = (id) => {
    setDeleteId(id);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/tasks/${deleteId}`);
      setTickets((prev) => prev.filter((ticket) => ticket._id !== deleteId));
      setFilteredTickets((prev) => prev.filter((ticket) => ticket._id !== deleteId));
      setModalOpen(false);
      setToast({ show: true, message: "Ticket deleted successfully", type: "success" });
    } catch (err) {
      setToast({ show: true, message: "Failed to delete ticket", type: "error" });
    }
  };

  const handleMarkProgress = (ticket) => {
    setSelectedTicketForProgress(ticket);
    setProgressModalOpen(true);
  };

  const confirmMarkProgress = async () => {
    try {
      const progressStatus = userRole === "employee" ? "Pending" : "Completed";
      await api.put(`/tasks/${selectedTicketForProgress._id}/progress`, { progressStatus });
      
      // Update local state
      const updatedTickets = tickets.map(ticket => 
        ticket._id === selectedTicketForProgress._id 
          ? { ...ticket, progressStatus }
          : ticket
      );
      setTickets(updatedTickets);
      setFilteredTickets(updatedTickets);
      
      setProgressModalOpen(false);
      setSelectedTicketForProgress(null);
      setToast({ 
        show: true, 
        message: userRole === "employee" 
          ? "Work marked as pending for review" 
          : "Task marked as completed", 
        type: "success" 
      });
    } catch (err) {
      setToast({ show: true, message: "Failed to update progress", type: "error" });
    }
  };

  // Function to check if deadline is approaching or overdue
  const getDeadlineStatus = (deadline) => {
    if (!deadline) return { status: "", color: "" };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: "", color: "text-red-600 font-semibold" };
    } else if (diffDays <= 3) {
      return { status: "", color: "text-orange-600 font-semibold" };
    } else {
      return { status: "", color: "" };
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-blue-50">
      <Navbar />

      <div className="flex-1 px-6 py-6 w-full">
        {/* ================= HEADER ================= */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-blue-700">Tickets</h1>

          <div className="flex gap-3 w-full sm:w-auto">
            {/* 🔍 OVAL SEARCH */}
            <input
              type="text"
              placeholder="Search by ticket ID, title or assignee..."
              className="px-6 py-2 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-400 w-full sm:w-80"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* ➕ OVAL BUTTON */}
          {(userRole === "admin" || userRole === "manager") && (
            <button
                onClick={() => navigate("/add-task")}
                className="bg-blue-600 text-white px-6 py-2 rounded-full shadow hover:bg-blue-700 transition"
            >
              + Add Ticket
            </button>
          )}
          </div>
        </div>

        {/* ================= TABLE ================= */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-12 w-12 border-t-4 border-blue-600 rounded-full" />
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow w-full">
            <table className="w-full text-left">
              <thead className="bg-blue-600 text-white text-lg">
                <tr>
                  <th className="p-4">Ticket ID</th>
                  <th className="p-4">Title</th>
                  <th className="p-4">Team</th>
                  <th className="p-4">Assigned To</th>
                  <th className="p-4">Deadline</th>
                  <th className="p-4">Progress</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => {
                  const deadlineStatus = getDeadlineStatus(ticket.dueDate);
                  return (
                    <tr key={ticket._id} className="border-b hover:bg-blue-50">
                      <td className="p-4">{ticket.taskId}</td>
                      <td className="p-4 font-medium">{ticket.title}</td>
                      <td className="p-4">{ticket.team?.team_name || "N/A"}</td>
                      <td className="p-4">{ticket.assignedTo?.name || "Unassigned"}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <FiCalendar className="text-gray-500" size={16} />
                          <span>{ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : "Not Set"}</span>
                          {deadlineStatus.status && (
                            <span className={`ml-2 ${deadlineStatus.color}`}>
                              ({deadlineStatus.status})
                            </span>
                          )}
          </div>
                      </td>
                      <td className="p-4">
                        {ticket.progressStatus ? (
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            ticket.progressStatus === "Pending" 
                              ? "bg-yellow-100 text-yellow-800" 
                              : "bg-green-100 text-green-800"
                          }`}>
                            {ticket.progressStatus}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4 flex justify-center gap-6">
                        <FiEye
                          onClick={() => {
                            setViewTicket(ticket);
                            setViewModalOpen(true);
                          }}
                          className="text-blue-600 cursor-pointer hover:text-blue-800"
                          size={20}
                        />
                        {/* Mark Icon - Show based on role and progress status */}
                        {((userRole === "employee" && !ticket.progressStatus) || 
                          ((userRole === "admin" || userRole === "manager") && ticket.progressStatus === "Pending")) && (
                          <FiCheck
                            onClick={() => handleMarkProgress(ticket)}
                            className="text-green-600 cursor-pointer hover:text-green-800"
                            size={20}
                            title={userRole === "employee" ? "Mark work as completed" : "Mark as completed"}
                          />
                        )}
                        {(userRole === "admin" || userRole === "manager") && (
                          <>
                            <FiEdit
                              onClick={() => navigate(`/edit-task/${ticket._id}`)}
                              className="text-green-600 cursor-pointer hover:text-green-800"
                              size={20}
                            />
                            <FiTrash2
                              onClick={() => confirmDelete(ticket._id)}
                              className="text-red-600 cursor-pointer hover:text-red-800"
                              size={20}
                            />
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        </div>

      {/* ===== VIEW MODAL ===== */}
      {viewModalOpen && viewTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-[500px] h-[550px] p-6 flex flex-col justify-between">
            <h2 className="text-2xl font-bold text-blue-700 text-center">Ticket Details</h2>

            <div className="grid grid-cols-2 gap-4 text-sm mt-6">
              <p><b>Ticket ID:</b> {viewTicket.taskId}</p>
              <p><b>Title:</b> {viewTicket.title}</p>
              <p><b>Status:</b> 
                <span className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${statusColors[viewTicket.status]}`}>
                  {viewTicket.status}
                </span>
              </p>
              <p><b>Priority:</b> 
                <span className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityColors[viewTicket.priority]}`}>
                  {viewTicket.priority}
                </span>
              </p>
              <p><b>Assigned To:</b> {viewTicket.assignedTo?.name || "Unassigned"}</p>
              <p><b>Team:</b> {viewTicket.team?.team_name || "N/A"}</p>
              <p><b>Progress Status:</b> 
                {viewTicket.progressStatus ? (
                  <span className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    viewTicket.progressStatus === "Pending" 
                      ? "bg-yellow-100 text-yellow-800" 
                      : "bg-green-100 text-green-800"
                  }`}>
                    {viewTicket.progressStatus}
                  </span>
                ) : (
                  <span className="text-gray-400 ml-2">-</span>
                )}
              </p>
              <p><b>Start Date:</b> {viewTicket.startDate ? new Date(viewTicket.startDate).toLocaleDateString() : "N/A"}</p>
              <p><b>Due Date:</b> {viewTicket.dueDate ? new Date(viewTicket.dueDate).toLocaleDateString() : "N/A"}</p>
              <p className="col-span-2"><b>Description:</b> {viewTicket.description || "No description"}</p>
              <p className="col-span-2"><b>Notes:</b> {viewTicket.notes || "No notes"}</p>
            </div>

              <button
              onClick={() => setViewModalOpen(false)}
              className="bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
            >
              Close
              </button>
            </div>
          </div>
        )}

      {/* ================= PROGRESS MODAL ================= */}
      {progressModalOpen && selectedTicketForProgress && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
            <h2 className="text-lg font-bold text-blue-600 mb-3">
              {userRole === "employee" ? "Mark Work as Completed" : "Mark as Completed"}
            </h2>
            <p className="mb-4">
              {userRole === "employee" 
                ? "Mark work as completed? This will set the status to Pending for review."
                : "Mark this task as completed? This will finalize the task."}
            </p>
            <div className="flex gap-4 mt-4 justify-center">
              <button 
                onClick={() => {
                  setProgressModalOpen(false);
                  setSelectedTicketForProgress(null);
                }} 
                className="px-4 py-2 bg-gray-200 rounded-full hover:bg-gray-300"
              >
                Cancel
              </button>
              <button 
                onClick={confirmMarkProgress} 
                className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE MODAL ================= */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <h2 className="text-lg font-bold text-red-600 mb-3">Confirm Delete</h2>
            <p>Are you sure you want to delete this ticket?</p>
            <div className="flex gap-4 mt-4 justify-center">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-full">
                Cancel
              </button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-full">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast {...toast} isVisible={toast.show} onClose={() => setToast({ ...toast, show: false })} />
      <Footer />
    </div>
  );
};

export default Task;













// // Task.jsx
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import Navbar from "../components/Navbar";
// import Footer from "../components/Footer";
// import Toast from "../components/Toast";
// import { FiMoreVertical, FiClock, FiUser, FiCalendar, FiEye, FiX } from "react-icons/fi";

// const statusColors = {
//   "Not Started": "bg-gray-500",
//   "In Progress": "bg-blue-500",
//   "On Hold": "bg-yellow-500",
//   Completed: "bg-green-500",
//   "In Review": "bg-purple-500",
//   Pending: "bg-yellow-500",
// };

// const priorityColors = {
//   Low: "bg-green-100 text-green-800",
//   Medium: "bg-yellow-100 text-yellow-800", 
//   High: "bg-orange-100 text-orange-800",
//   Critical: "bg-red-100 text-red-800",
// };

// const Tickets = () => {
//   const [tickets, setTickets] = useState([]);
//   const [filteredTickets, setFilteredTickets] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // filters
//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [teamFilter, setTeamFilter] = useState("");
//   const [managerFilter, setManagerFilter] = useState("");
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");

//   const [teams, setTeams] = useState([]);
//   const [managers, setManagers] = useState([]);

//   const [showDropdown, setShowDropdown] = useState(null);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [deleteId, setDeleteId] = useState(null);
//   const [viewModalOpen, setViewModalOpen] = useState(false);
//   const [selectedTicket, setSelectedTicket] = useState(null);

//   const [userRole, setUserRole] = useState("");
//   const [toast, setToast] = useState({ show: false, message: "", type: "success" });

//   const [summary, setSummary] = useState({
//     total: 0,
//     pending: 0,
//     inProgress: 0,
//     completed: 0,
//   });

//   const token = localStorage.getItem("token");

//   /* ================= INITIAL LOAD ================= */
//   useEffect(() => {
//     const role = localStorage.getItem("role") || "";
//     setUserRole(role.toLowerCase());
    
//     const loadData = async () => {
//       try {
//         const [ticketRes, teamRes, managerRes] = await Promise.all([
//           axios.get("http://localhost:5000/api/tasks", {
//             headers: { Authorization: `Bearer ${token}` },
//           }),
//           axios.get("http://localhost:5000/api/teams"),
//           axios.get("http://localhost:5000/api/users/managers"),
//         ]);

//         setTickets(ticketRes.data);
//         setFilteredTickets(ticketRes.data);
//         calculateSummary(ticketRes.data);

//         setTeams(teamRes.data || []);
//         setManagers(managerRes.data || []);
//       } catch (err) {
//         console.error("Error loading ticket data:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadData();
//   }, [token]);

//   /* ================= SUMMARY ================= */
//   const calculateSummary = (data) => {
//     setSummary({
//       total: data.length,
//       pending: data.filter((t) => t.status === "Pending").length,
//       inProgress: data.filter((t) => t.status === "In Progress").length,
//       completed: data.filter((t) => t.status === "Completed").length,
//     });
//   };

//   /* ================= FILTER LOGIC ================= */
//   useEffect(() => {
//     let temp = [...tickets];

//     if (search) {
//       temp = temp.filter(
//         (t) =>
//           t.title.toLowerCase().includes(search.toLowerCase()) ||
//           t.assignedTo?.name?.toLowerCase().includes(search.toLowerCase())
//       );
//     }

//     if (statusFilter) {
//       temp = temp.filter((t) => t.status === statusFilter);
//     }

//     if (teamFilter) {
//       temp = temp.filter((t) => t.team?._id === teamFilter);
//     }

//     if (managerFilter) {
//       temp = temp.filter((t) => t.createdBy?._id === managerFilter);
//     }

//     if (fromDate) {
//       temp = temp.filter((t) => new Date(t.dueDate) >= new Date(fromDate));
//     }

//     if (toDate) {
//       temp = temp.filter((t) => new Date(t.dueDate) <= new Date(toDate));
//     }

//     setFilteredTickets(temp);
//   }, [search, statusFilter, teamFilter, managerFilter, fromDate, toDate, tickets]);

//   /* ================= VIEW TICKET ================= */
//   const handleView = (ticket) => {
//     setSelectedTicket(ticket);
//     setViewModalOpen(true);
//   };

//   /* ================= DELETE ================= */
//   const confirmDelete = (id) => {
//     setDeleteId(id);
//     setModalOpen(true);
//     setShowDropdown(null);
//   };

//   const handleDelete = async () => {
//     try {
//       await axios.delete(`http://localhost:5000/api/tasks/${deleteId}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const updated = tickets.filter((t) => t._id !== deleteId);
//       setTickets(updated);
//       setFilteredTickets(updated);
//       calculateSummary(updated);

//       setModalOpen(false);
//       setToast({ show: true, message: "Ticket deleted successfully!", type: "success" });
//     } catch (err) {
//       setToast({ show: true, message: "Failed to delete ticket.", type: "error" });
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-blue-100">
//       <Navbar />

//       <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
//         {/* ================= HEADER ================= */}
//         <div className="flex justify-between items-center mb-6">
//           <h1 className="text-4xl font-extrabold text-blue-700">Tickets Overview</h1>

//           {(userRole === "admin" || userRole === "manager") && (
//             <button
//               onClick={() => (window.location.href = "/AddTask")}
//               className="bg-blue-600 text-white px-5 py-2 rounded-full shadow-lg hover:bg-blue-700 transition"
//             >
//               + Add Ticket
//             </button>
//           )}
//         </div>

//         {/* ================= SUMMARY CARDS ================= */}
//         <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
//           <div className="bg-white p-4 rounded-xl shadow text-center">
//             <div className="text-sm text-gray-500">Total Tickets</div>
//             <div className="text-2xl font-bold text-blue-700">{summary.total}</div>
//           </div>
//           <div className="bg-white p-4 rounded-xl shadow text-center">
//             <div className="text-sm text-gray-500">Pending</div>
//             <div className="text-2xl font-bold text-yellow-600">{summary.pending}</div>
//           </div>
//           <div className="bg-white p-4 rounded-xl shadow text-center">
//             <div className="text-sm text-gray-500">In Progress</div>
//             <div className="text-2xl font-bold text-blue-600">{summary.inProgress}</div>
//           </div>
//           <div className="bg-white p-4 rounded-xl shadow text-center">
//             <div className="text-sm text-gray-500">Completed</div>
//             <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
//           </div>
//         </div>

//         {/* ================= BIG FILTER CARD ================= */}
//         {(userRole === "admin" || userRole === "manager") && (
//           <div className="bg-white p-4 rounded-xl shadow mb-6">
//             <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-center">
//               <input
//                 className="px-4 py-2 rounded-full border w-full sm:w-64"
//                 placeholder="Search ticket or assignee..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//               />

//               <select className="px-4 py-2 rounded-full border" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
//                 <option value="">All Status</option>
//                 <option value="Pending">Pending</option>
//                 <option value="In Progress">In Progress</option>
//                 <option value="Completed">Completed</option>
//               </select>

//               <select className="px-4 py-2 rounded-full border" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
//                 <option value="">All Teams</option>
//                 {teams.map((t) => (
//                   <option key={t._id} value={t._id}>{t.team_name}</option>
//                 ))}
//               </select>

//               <select className="px-4 py-2 rounded-full border" value={managerFilter} onChange={(e) => setManagerFilter(e.target.value)}>
//                 <option value="">All Managers</option>
//                 {managers.map((m) => (
//                   <option key={m._id} value={m._id}>{m.name}</option>
//                 ))}
//               </select>

//               <input type="date" className="px-3 py-2 rounded-full border" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
//               <input type="date" className="px-3 py-2 rounded-full border" value={toDate} onChange={(e) => setToDate(e.target.value)} />

//               <button
//                 onClick={() => {
//                   setSearch("");
//                   setStatusFilter("");
//                   setTeamFilter("");
//                   setManagerFilter("");
//                   setFromDate("");
//                   setToDate("");
//                 }}
//                 className="px-4 py-2 rounded-full border"
//               >
//                 Reset
//               </button>
//             </div>
//           </div>
//         )}

//         {/* ================= TICKET TABLE ================= */}
//         {loading ? (
//           <div className="flex justify-center py-20">
//             <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600" />
//           </div>
//         ) : filteredTickets.length === 0 ? (
//           <p className="text-center text-gray-600 py-10">No tickets found.</p>
//         ) : (
//           <div className="bg-white rounded-xl shadow-lg overflow-hidden">
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-blue-600 text-white">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">#</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Title</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Assigned To</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Team</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Priority</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Due Date</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Created</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {filteredTickets.map((ticket, index) => (
//                     <tr key={ticket._id} className="hover:bg-gray-50 transition">
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm font-medium text-gray-900">{ticket.title || "Untitled"}</div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm text-gray-900">{ticket.assignedTo?.name || "Unassigned"}</div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="text-sm text-gray-900">{ticket.team?.team_name || "N/A"}</div>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${statusColors[ticket.status] || "bg-gray-500"}`}>
//                           {ticket.status || "N/A"}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityColors[ticket.priority] || "bg-gray-100 text-gray-800"}`}>
//                           {ticket.priority || "Medium"}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         {ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : "N/A"}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "N/A"}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                         <button
//                           onClick={() => handleView(ticket)}
//                           className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
//                         >
//                           <FiEye /> View
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* ================= VIEW TICKET MODAL ================= */}
//       {viewModalOpen && selectedTicket && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-screen overflow-y-auto">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-2xl font-bold text-gray-800">Ticket Details</h2>
//               <button 
//                 onClick={() => setViewModalOpen(false)}
//                 className="text-gray-500 hover:text-gray-700"
//               >
//                 <FiX size={24} />
//               </button>
//             </div>
            
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <h3 className="text-lg font-semibold mb-2">Ticket Information</h3>
//                 <div className="mb-2"><span className="font-medium">Title:</span> {selectedTicket.title}</div>
//                 <div className="mb-2">
//                   <span className="font-medium">Description:</span> 
//                   <p className="mt-1 text-sm text-gray-700">{selectedTicket.description || "No description provided"}</p>
//                 </div>
//                 <div className="mb-2"><span className="font-medium">Category:</span> {selectedTicket.category}</div>
//                 <div className="mb-2">
//                   <span className="font-medium">Priority:</span> 
//                   <span className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityColors[selectedTicket.priority]}`}>
//                     {selectedTicket.priority}
//                   </span>
//                 </div>
//                 <div className="mb-2">
//                   <span className="font-medium">Status:</span> 
//                   <span className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${statusColors[selectedTicket.status]}`}>
//                     {selectedTicket.status}
//                   </span>
//                 </div>
//                  <div className="mb-2">
//                   <span className="font-medium">Progress:</span> 
//                   <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
//                     <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${selectedTicket.progress}%` }}></div>
//                   </div>
//                   <span className="text-sm text-gray-600">{selectedTicket.progress}%</span>
//                 </div>
//               </div>
              
//               <div>
//                 <h3 className="text-lg font-semibold mb-2">Assignment & Timeline</h3>
//                 <div className="mb-2"><span className="font-medium">Assigned To:</span> {selectedTicket.assignedTo?.name || "Unassigned"}</div>
//                 <div className="mb-2"><span className="font-medium">Team:</span> {selectedTicket.team?.team_name || "N/A"}</div>
//                 <div className="mb-2"><span className="font-medium">Start Date:</span> {selectedTicket.startDate ? new Date(selectedTicket.startDate).toLocaleDateString() : "N/A"}</div>
//                 <div className="mb-2"><span className="font-medium">Due Date:</span> {selectedTicket.dueDate ? new Date(selectedTicket.dueDate).toLocaleDateString() : "N/A"}</div>
//                 <div className="mb-2"><span className="font-medium">Estimated Hours:</span> {selectedTicket.estimatedHours || "N/A"}</div>
//                 <div className="mb-2"><span className="font-medium">Created:</span> {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleDateString() : "N/A"}</div>
//                 <div className="mb-2"><span className="font-medium">Created By:</span> {selectedTicket.createdBy?.name || "N/A"}</div>
//               </div>
//             </div>
            
//             {selectedTicket.tags && (
//               <div className="mt-4">
//                 <h3 className="text-lg font-semibold mb-2">Tags</h3>
//                 <div className="flex flex-wrap gap-2">
//                   {selectedTicket.tags.split(',').map((tag, index) => (
//                     <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
//                       {tag.trim()}
//                     </span>
//                   ))}
//                 </div>
//               </div>
//             )}
            
//             {selectedTicket.notes && (
//               <div className="mt-4">
//                 <h3 className="text-lg font-semibold mb-2">Notes</h3>
//                 <p className="text-sm text-gray-700">{selectedTicket.notes}</p>
//               </div>
//             )}
            
//             {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
//               <div className="mt-4">
//                 <h3 className="text-lg font-semibold mb-2">Attachments</h3>
//                 <div className="space-y-2">
//                   {selectedTicket.attachments.map((attachment, index) => (
//                     <div key={index} className="flex items-center gap-2">
//                       <a href={`http://localhost:5000/${attachment.path}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
//                         {attachment.filename || `Attachment ${index + 1}`}
//                       </a>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
            
//             <div className="mt-6 flex justify-end gap-4">
//               <button onClick={() => setViewModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition">Close</button>
//               {(userRole === "admin" || userRole === "manager") && (
//                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Edit Ticket</button>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ================= DELETE CONFIRMATION MODAL ================= */}
//       {modalOpen && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 w-full max-w-md">
//             <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
//             <p className="mb-6">Are you sure you want to delete this ticket? This action cannot be undone.</p>
//             <div className="flex justify-end gap-4">
//               <button
//                 onClick={() => setModalOpen(false)}
//                 className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleDelete}
//                 className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ ...toast, show: false })} />
//       <Footer />
//     </div>
//   );
// };

// export default Tickets;













// // import React, { useEffect, useState } from "react";
// // import axios from "axios";
// // import Navbar from "../components/Navbar";
// // import Footer from "../components/Footer";
// // import Toast from "../components/Toast";
// // import { FiMoreVertical, FiClock, FiUser, FiCalendar, FiEye, FiX } from "react-icons/fi";

// // const statusColors = {
// //   "Not Started": "bg-gray-500",
// //   "In Progress": "bg-blue-500",
// //   "On Hold": "bg-yellow-500",
// //   Completed: "bg-green-500",
// //   "In Review": "bg-purple-500",
// //   Pending: "bg-yellow-500",
// // };

// // const priorityColors = {
// //   Low: "bg-green-100 text-green-800",
// //   Medium: "bg-yellow-100 text-yellow-800", 
// //   High: "bg-orange-100 text-orange-800",
// //   Critical: "bg-red-100 text-red-800",
// // };

// // const Tickets = () => {
// //   const [tickets, setTickets] = useState([]);
// //   const [filteredTickets, setFilteredTickets] = useState([]);
// //   const [loading, setLoading] = useState(true);

// //   // filters
// //   const [search, setSearch] = useState("");
// //   const [statusFilter, setStatusFilter] = useState("");
// //   const [teamFilter, setTeamFilter] = useState("");
// //   const [managerFilter, setManagerFilter] = useState("");
// //   const [fromDate, setFromDate] = useState("");
// //   const [toDate, setToDate] = useState("");

// //   const [teams, setTeams] = useState([]);
// //   const [managers, setManagers] = useState([]);

// //   const [showDropdown, setShowDropdown] = useState(null);
// //   const [modalOpen, setModalOpen] = useState(false);
// //   const [deleteId, setDeleteId] = useState(null);
// //   const [viewModalOpen, setViewModalOpen] = useState(false);
// //   const [selectedTicket, setSelectedTicket] = useState(null);

// //   const [userRole, setUserRole] = useState("");
// //   const [toast, setToast] = useState({ show: false, message: "", type: "success" });

// //   const [summary, setSummary] = useState({
// //     total: 0,
// //     pending: 0,
// //     inProgress: 0,
// //     completed: 0,
// //   });

// //   const token = localStorage.getItem("token");

// //   /* ================= INITIAL LOAD ================= */
// //   useEffect(() => {
// //     const role = localStorage.getItem("role") || "";
// //     setUserRole(role.toLowerCase());

// //     const loadData = async () => {
// //       try {
// //         const [ticketRes, teamRes, managerRes] = await Promise.all([
// //           axios.get("http://localhost:5000/api/tasks", {
// //             headers: { Authorization: `Bearer ${token}` },
// //           }),
// //           axios.get("http://localhost:5000/api/teams"),
// //           axios.get("http://localhost:5000/api/users/managers"),
// //         ]);

// //         setTickets(ticketRes.data);
// //         setFilteredTickets(ticketRes.data);
// //         calculateSummary(ticketRes.data);

// //         setTeams(teamRes.data || []);
// //         setManagers(managerRes.data || []);
// //       } catch (err) {
// //         console.error("Error loading ticket data:", err);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     loadData();
// //   }, []);

// //   /* ================= SUMMARY ================= */
// //   const calculateSummary = (data) => {
// //     setSummary({
// //       total: data.length,
// //       pending: data.filter((t) => t.status === "Pending").length,
// //       inProgress: data.filter((t) => t.status === "In Progress").length,
// //       completed: data.filter((t) => t.status === "Completed").length,
// //     });
// //   };

// //   /* ================= FILTER LOGIC ================= */
// //   useEffect(() => {
// //     let temp = [...tickets];

// //     if (search) {
// //       temp = temp.filter(
// //         (t) =>
// //           t.title.toLowerCase().includes(search.toLowerCase()) ||
// //           t.assignedTo?.name?.toLowerCase().includes(search.toLowerCase())
// //       );
// //     }

// //     if (statusFilter) {
// //       temp = temp.filter((t) => t.status === statusFilter);
// //     }

// //     if (teamFilter) {
// //       temp = temp.filter((t) => t.team?._id === teamFilter);
// //     }

// //     if (managerFilter) {
// //       temp = temp.filter((t) => t.manager?._id === managerFilter);
// //     }

// //     if (fromDate) {
// //       temp = temp.filter((t) => new Date(t.dueDate) >= new Date(fromDate));
// //     }

// //     if (toDate) {
// //       temp = temp.filter((t) => new Date(t.dueDate) <= new Date(toDate));
// //     }

// //     setFilteredTickets(temp);
// //   }, [search, statusFilter, teamFilter, managerFilter, fromDate, toDate, tickets]);

// //   /* ================= VIEW TICKET ================= */
// //   const handleView = (ticket) => {
// //     setSelectedTicket(ticket);
// //     setViewModalOpen(true);
// //   };

// //   /* ================= DELETE ================= */
// //   const confirmDelete = (id) => {
// //     setDeleteId(id);
// //     setModalOpen(true);
// //     setShowDropdown(null);
// //   };

// //   const handleDelete = async () => {
// //     try {
// //       await axios.delete(`http://localhost:5000/api/tasks/${deleteId}`, {
// //         headers: { Authorization: `Bearer ${token}` },
// //       });

// //       const updated = tickets.filter((t) => t._id !== deleteId);
// //       setTickets(updated);
// //       setFilteredTickets(updated);
// //       calculateSummary(updated);

// //       setModalOpen(false);
// //       setToast({ show: true, message: "Ticket deleted successfully!", type: "success" });
// //     } catch (err) {
// //       setToast({ show: true, message: "Failed to delete ticket.", type: "error" });
// //     }
// //   };

// //   return (
// //     <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-blue-100">
// //       <Navbar />

// //       <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
// //         {/* ================= HEADER ================= */}
// //         <div className="flex justify-between items-center mb-6">
// //           <h1 className="text-4xl font-extrabold text-blue-700">Tickets Overview</h1>

// //           {(userRole === "admin" || userRole === "manager") && (
// //             <button
// //               onClick={() => (window.location.href = "/AddTask")}
// //               className="bg-blue-600 text-white px-5 py-2 rounded-full shadow-lg hover:bg-blue-700 transition"
// //             >
// //               + Add Ticket
// //             </button>
// //           )}
// //         </div>

// //         {/* ================= SUMMARY CARDS ================= */}
// //         <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
// //           <div className="bg-white p-4 rounded-xl shadow text-center">
// //             <div className="text-sm text-gray-500">Total Tickets</div>
// //             <div className="text-2xl font-bold text-blue-700">{summary.total}</div>
// //           </div>
// //           <div className="bg-white p-4 rounded-xl shadow text-center">
// //             <div className="text-sm text-gray-500">Pending</div>
// //             <div className="text-2xl font-bold text-yellow-600">{summary.pending}</div>
// //           </div>
// //           <div className="bg-white p-4 rounded-xl shadow text-center">
// //             <div className="text-sm text-gray-500">In Progress</div>
// //             <div className="text-2xl font-bold text-blue-600">{summary.inProgress}</div>
// //           </div>
// //           <div className="bg-white p-4 rounded-xl shadow text-center">
// //             <div className="text-sm text-gray-500">Completed</div>
// //             <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
// //           </div>
// //         </div>

// //         {/* ================= BIG FILTER CARD ================= */}
// //         {(userRole === "admin" || userRole === "manager") && (
// //           <div className="bg-white p-4 rounded-xl shadow mb-6">
// //             <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-center">
// //               <input
// //                 className="px-4 py-2 rounded-full border w-full sm:w-64"
// //                 placeholder="Search ticket or assignee..."
// //                 value={search}
// //                 onChange={(e) => setSearch(e.target.value)}
// //               />

// //               <select className="px-4 py-2 rounded-full border" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
// //                 <option value="">All Status</option>
// //                 <option value="Pending">Pending</option>
// //                 <option value="In Progress">In Progress</option>
// //                 <option value="Completed">Completed</option>
// //               </select>

// //               <select className="px-4 py-2 rounded-full border" value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
// //                 <option value="">All Teams</option>
// //                 {teams.map((t) => (
// //                   <option key={t._id} value={t._id}>{t.team_name}</option>
// //                 ))}
// //               </select>

// //               <select className="px-4 py-2 rounded-full border" value={managerFilter} onChange={(e) => setManagerFilter(e.target.value)}>
// //                 <option value="">All Managers</option>
// //                 {managers.map((m) => (
// //                   <option key={m._id} value={m._id}>{m.name}</option>
// //                 ))}
// //               </select>

// //               <input type="date" className="px-3 py-2 rounded-full border" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
// //               <input type="date" className="px-3 py-2 rounded-full border" value={toDate} onChange={(e) => setToDate(e.target.value)} />

// //               <button
// //                 onClick={() => {
// //                   setSearch("");
// //                   setStatusFilter("");
// //                   setTeamFilter("");
// //                   setManagerFilter("");
// //                   setFromDate("");
// //                   setToDate("");
// //                 }}
// //                 className="px-4 py-2 rounded-full border"
// //               >
// //                 Reset
// //               </button>
// //             </div>
// //           </div>
// //         )}

// //         {/* ================= TICKET TABLE ================= */}
// //         {loading ? (
// //           <div className="flex justify-center py-20">
// //             <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600" />
// //           </div>
// //         ) : filteredTickets.length === 0 ? (
// //           <p className="text-center text-gray-600 py-10">No tickets found.</p>
// //         ) : (
// //           <div className="bg-white rounded-xl shadow-lg overflow-hidden">
// //             <div className="overflow-x-auto">
// //               <table className="w-full">
// //                 <thead className="bg-blue-600 text-white">
// //                   <tr>
// //                     <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">#</th>
// //                     <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Title</th>
// //                     <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Assigned To</th>
// //                     <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Team</th>
// //                     <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
// //                     <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Priority</th>
// //                     <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Due Date</th>
// //                     <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Created</th>
// //                     <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
// //                   </tr>
// //                 </thead>
// //                 <tbody className="bg-white divide-y divide-gray-200">
// //                   {filteredTickets.map((ticket, index) => (
// //                     <tr key={ticket._id} className="hover:bg-gray-50 transition">
// //                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
// //                       <td className="px-6 py-4 whitespace-nowrap">
// //                         <div className="text-sm font-medium text-gray-900">{ticket.title || "Untitled"}</div>
// //                       </td>
// //                       <td className="px-6 py-4 whitespace-nowrap">
// //                         <div className="text-sm text-gray-900">{ticket.assignedTo?.name || "Unassigned"}</div>
// //                       </td>
// //                       <td className="px-6 py-4 whitespace-nowrap">
// //                         <div className="text-sm text-gray-900">{ticket.team?.team_name || "N/A"}</div>
// //                       </td>
// //                       <td className="px-6 py-4 whitespace-nowrap">
// //                         <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full text-white ${statusColors[ticket.status] || "bg-gray-500"}`}>
// //                           {ticket.status || "N/A"}
// //                         </span>
// //                       </td>
// //                       <td className="px-6 py-4 whitespace-nowrap">
// //                         <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityColors[ticket.priority] || "bg-gray-100 text-gray-800"}`}>
// //                           {ticket.priority || "Medium"}
// //                         </span>
// //                       </td>
// //                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
// //                         {ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : "N/A"}
// //                       </td>
// //                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
// //                         {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "N/A"}
// //                       </td>
// //                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
// //                         <button
// //                           onClick={() => handleView(ticket)}
// //                           className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
// //                         >
// //                           <FiEye /> View
// //                         </button>
// //                       </td>
// //                     </tr>
// //                   ))}
// //                 </tbody>
// //               </table>
// //             </div>
            
// //           </div>
// //         )}
// //       </div>

// //       <Toast message={toast.message} type={toast.type} isVisible={toast.show} onClose={() => setToast({ ...toast, show: false })} />
// //       <Footer />
// //     </div>
// //   );
// // };

// // export default Tickets;














// // commented at 25/12/25
// // import React, { useEffect, useState } from "react";
// // import axios from "axios";
// // import Navbar from "../components/Navbar";
// // import Footer from "../components/Footer";
// // import Toast from "../components/Toast";
// // import { FiMoreVertical, FiClock, FiUser, FiCalendar } from "react-icons/fi";

// // const statusColors = {
// //   "Pending": "bg-yellow-500",
// //   "In Progress": "bg-blue-500",
// //   "Completed": "bg-green-500",
// // };

// // const Tickets = () => {
// //   const [tickets, setTickets] = useState([]);
// //   const [filteredTickets, setFilteredTickets] = useState([]);
// //   const [search, setSearch] = useState("");
// //   const [loading, setLoading] = useState(true);
// //   const [showDropdown, setShowDropdown] = useState(null);
// //   const [modalOpen, setModalOpen] = useState(false);
// //   const [deleteId, setDeleteId] = useState(null);
// //   const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
// //   const [userRole, setUserRole] = useState("");

// //   const token = localStorage.getItem("token");

// //   // Fetch all tickets
// //   useEffect(() => {
// //     const role = localStorage.getItem("role") || "";
// //     setUserRole(role.toLowerCase());
    
// //     const loadTickets = async () => {
// //       try {
// //         const res = await axios.get("http://localhost:5000/api/tasks", {
// //           headers: { Authorization: `Bearer ${token}` },
// //         });

// //         setTickets(res.data);
// //         setFilteredTickets(res.data);
// //       } catch (err) {
// //         console.error("Error loading tickets:", err);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     loadTickets();
// //   }, []);

// //   // Search filter
// //   useEffect(() => {
// //     if (!search) setFilteredTickets(tickets);
// //     else {
// //       setFilteredTickets(
// //         tickets.filter(
// //           (ticket) =>
// //             ticket.title.toLowerCase().includes(search.toLowerCase()) ||
// //             ticket.status.toLowerCase().includes(search.toLowerCase()) ||
// //             ticket.assignedTo?.name?.toLowerCase().includes(search.toLowerCase())
// //         )
// //       );
// //     }
// //   }, [search, tickets]);

// //   // Confirm delete
// //   const confirmDelete = (id) => {
// //     setDeleteId(id);
// //     setModalOpen(true);
// //   };

// //   // Handle delete
// //   const handleDelete = async () => {
// //     try {
// //       await axios.delete(`http://localhost:5000/api/tasks/${deleteId}`, {
// //         headers: { Authorization: `Bearer ${token}` },
// //       });

// //       setTickets((prev) => prev.filter((t) => t._id !== deleteId));
// //       setFilteredTickets((prev) => prev.filter((t) => t._id !== deleteId));
// //       setModalOpen(false);
// //       setToast({ show: true, message: 'Ticket deleted successfully!', type: 'success' });
// //     } catch (err) {
// //       console.error(err);
// //       setToast({ show: true, message: 'Failed to delete ticket.', type: 'error' });
// //     }
// //   };

// //   return (
// //     <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-blue-100">
// //       <Navbar />

// //       <div className="flex-1 p-6 max-w-7xl mx-auto w-full">

// //         {/* Header + Search + Add btn */}
// //         <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-8">
// //           <h1 className="text-4xl font-extrabold text-blue-700">Tickets Overview</h1>

// //           <div className="flex gap-3 flex-col sm:flex-row w-full sm:w-auto">
// //             {(userRole === "admin" || userRole === "manager") && (
// //               <input
// //                 type="text"
// //                 placeholder="Search by ticket, status, or assignee..."
// //                 className="px-4 py-2 rounded-full shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1 sm:w-64"
// //                 value={search}
// //                 onChange={(e) => setSearch(e.target.value)}
// //               />
// //             )}
// //             {(userRole === "admin" || userRole === "manager") && (
// //               <button
// //                 onClick={() => (window.location.href = "/AddTask")}
// //                 className="bg-blue-600 text-white px-5 py-2 rounded-full shadow-lg hover:bg-blue-700 transition flex items-center gap-2"
// //               >
// //                 + Add Ticket
// //               </button>
// //             )}
// //           </div>
// //         </div>

        

// //         {/* Loading */}
// //         {loading ? (
// //           <div className="flex justify-center items-center py-20">
// //             <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600" />
// //           </div>
// //         ) : filteredTickets.length === 0 ? (
// //           <p className="text-gray-600 text-center text-lg mt-10">
// //             No tickets found.
// //           </p>
// //         ) : (
// //           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
// //             {filteredTickets.map((ticket, index) => (
// //               <div
// //                 key={ticket._id}
// //                 className="bg-white rounded-3xl shadow-md p-6 flex flex-col items-center text-center border border-blue-200 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-fadeIn relative"
// //                 style={{ animationDelay: `${index * 100}ms` }}
// //               >
// //                 {/* Dropdown Menu */}
// //                 <div className="absolute top-4 right-4">
// //                   <button
// //                     onClick={() =>
// //                       setShowDropdown(showDropdown === ticket._id ? null : ticket._id)
// //                     }
// //                     className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition"
// //                   >
// //                     <FiMoreVertical />
// //                   </button>

// //                   <div
// //                     className={`absolute right-0 mt-2 w-32 bg-white border border-gray-300 rounded-md shadow-lg z-10 overflow-hidden transition-all duration-300 ${
// //                       showDropdown === ticket._id
// //                         ? "opacity-100 scale-100"
// //                         : "opacity-0 scale-95 pointer-events-none"
// //                     }`}
// //                   >
// //                     <button
// //                       onClick={() => (window.location.href = `/edit-task/${ticket._id}`)}
// //                       className="block w-full text-left px-4 py-2 hover:bg-blue-100"
// //                     >
// //                       Edit
// //                     </button>
// //                     <button
// //                       onClick={() => confirmDelete(ticket._id)}
// //                       className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-100"
// //                     >
// //                       Delete
// //                     </button>
// //                   </div>
// //                 </div>

// //                 {/* Ticket Icon */}
// //                 <div className="w-28 h-28 rounded-full overflow-hidden mb-4 border-4 border-blue-200 shadow-sm bg-blue-400 flex items-center justify-center">
// //                   <FiClock className="text-white text-4xl" />
// //                 </div>

// //                 <h2 className="text-2xl font-semibold text-blue-700">{ticket.title}</h2>
// //                 <span
// //                   className={`text-white px-3 py-1 rounded-full mt-1 ${
// //                     statusColors[ticket.status] || "bg-gray-500"
// //                   }`}
// //                 >
// //                   {ticket.status}
// //                 </span>

// //                 <p className="text-gray-500 text-sm mt-2">
// //                   {ticket.assignedTo?.name || "Unassigned"}
// //                 </p>
// //                 <p className="text-gray-500 text-sm">
// //                   {ticket.deadline || "No deadline"}
// //                 </p>
// //                 <p className="text-gray-500 text-sm">
// //                   Priority: {ticket.priority}
// //                 </p>

// //                 {/* Ticket Details */}
// //                 <div className="flex flex-col items-center mt-3 gap-1">
// //                   <div className="flex items-center gap-1 text-gray-600 text-sm">
// //                     <FiUser /> {ticket.assignedTo?.name || "Unassigned"}
// //                   </div>
// //                   <div className="flex items-center gap-1 text-gray-600 text-sm">
// //                     <FiCalendar /> {ticket.deadline || "No deadline"}
// //                   </div>
// //                 </div>
// //               </div>
// //             ))}
// //           </div>
// //         )}
// //       </div>

// //       {/* Delete Modal */}
// //       {modalOpen && (
// //         <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
// //           <div className="bg-white rounded-xl shadow-lg p-6 w-96 text-center animate-fadeIn">
// //             <h2 className="text-xl font-semibold text-red-600 mb-4">
// //               Confirm Delete
// //             </h2>
// //             <p className="mb-6">Are you sure you want to delete this ticket?</p>

// //             <div className="flex justify-center gap-4">
// //               <button
// //                 onClick={() => setModalOpen(false)}
// //                 className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
// //               >
// //                 Cancel
// //               </button>
// //               <button
// //                 onClick={handleDelete}
// //                 className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
// //               >
// //                 Delete
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       )}

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

// // export default Tickets;









// // it is last previous code.
// // import React, { useEffect, useState } from "react";
// // import axios from "axios";
// // import Navbar from "../components/Navbar";
// // import Footer from "../components/Footer";
// // import { FiMoreVertical, FiClock, FiUser, FiCalendar } from "react-icons/fi";

// // const statusColors = {
// //   "Pending": "bg-yellow-500",
// //   "In Progress": "bg-blue-500",
// //   "Completed": "bg-green-500",
// // };

// // const Tasks = () => {
// //   const [tasks, setTasks] = useState([]);
// //   const [filteredTasks, setFilteredTasks] = useState([]);
// //   const [search, setSearch] = useState("");
// //   const [loading, setLoading] = useState(true);
// //   const [showDropdown, setShowDropdown] = useState(null);
// //   const [modalOpen, setModalOpen] = useState(false);
// //   const [deleteId, setDeleteId] = useState(null);

// //   const token = localStorage.getItem("token");

// //   // Fetch all tasks
// //   useEffect(() => {
// //     const loadTasks = async () => {
// //       try {
// //         const res = await axios.get("http://localhost:5000/api/tasks", {
// //           headers: { Authorization: `Bearer ${token}` },
// //         });

// //         setTasks(res.data);
// //         setFilteredTasks(res.data);
// //       } catch (err) {
// //         console.error("Error loading tasks:", err);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     loadTasks();
// //   }, []);

// //   // Search filter
// //   useEffect(() => {
// //     if (!search) setFilteredTasks(tasks);
// //     else {
// //       setFilteredTasks(
// //         tasks.filter(
// //           (task) =>
// //             task.title.toLowerCase().includes(search.toLowerCase()) ||
// //             task.status.toLowerCase().includes(search.toLowerCase()) ||
// //             task.assignedTo?.name?.toLowerCase().includes(search.toLowerCase())
// //         )
// //       );
// //     }
// //   }, [search, tasks]);

// //   // Confirm delete
// //   const confirmDelete = (id) => {
// //     setDeleteId(id);
// //     setModalOpen(true);
// //   };

// //   // Handle delete
// //   const handleDelete = async () => {
// //     try {
// //       await axios.delete(`http://localhost:5000/api/tasks/${deleteId}`, {
// //         headers: { Authorization: `Bearer ${token}` },
// //       });

// //       setTasks((prev) => prev.filter((t) => t._id !== deleteId));
// //       setFilteredTasks((prev) => prev.filter((t) => t._id !== deleteId));
// //       setModalOpen(false);
// //       alert("Task deleted successfully!");
// //     } catch (err) {
// //       console.error(err);
// //       alert("Failed to delete task.");
// //     }
// //   };

// //   return (
// //     <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-blue-100">
// //       <Navbar />

// //       <div className="flex-1 p-6 max-w-7xl mx-auto">

// //         {/* Header + Search + Add btn */}
// //         <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-12">
// //           <h1 className="text-4xl font-extrabold text-blue-700">Tasks Overview</h1>

// //           <div className="flex gap-3 flex-col sm:flex-row w-full sm:w-auto">
// //             <input
// //               type="text"
// //               placeholder="Search by task, status, or assignee..."
// //               className="px-4 py-2 rounded-full shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1 sm:w-64"
// //               value={search}
// //               onChange={(e) => setSearch(e.target.value)}
// //             />
// //             <button
// //               onClick={() => (window.location.href = "/add-task")}
// //               className="bg-blue-600 text-white px-5 py-2 rounded-full shadow-lg hover:bg-blue-700 transition flex items-center gap-2"
// //             >
// //               + Add Task
// //             </button>
// //           </div>
// //         </div>

// //         {/* Loading */}
// //         {loading ? (
// //           <div className="flex justify-center items-center py-20">
// //             <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600" />
// //           </div>
// //         ) : filteredTasks.length === 0 ? (
// //           <p className="text-gray-600 text-center text-lg mt-10">
// //             No tasks found.
// //           </p>
// //         ) : (
// //           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
// //             {filteredTasks.map((task, index) => (
// //               <div
// //                 key={task._id}
// //                 className="bg-white rounded-3xl shadow-md p-6 flex flex-col items-center text-center border border-blue-200 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-fadeIn"
// //                 style={{ animationDelay: `${index * 100}ms` }}
// //               >
// //                 {/* Dropdown Menu */}
// //                 <div className="absolute top-4 right-4">
// //                   <button
// //                     onClick={() =>
// //                       setShowDropdown(showDropdown === task._id ? null : task._id)
// //                     }
// //                     className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition"
// //                   >
// //                     <FiMoreVertical />
// //                   </button>

// //                   <div
// //                     className={`absolute right-0 mt-2 w-32 bg-white border border-gray-300 rounded-md shadow-lg z-10 overflow-hidden transition-all duration-300 ${
// //                       showDropdown === task._id
// //                         ? "opacity-100 scale-100"
// //                         : "opacity-0 scale-95 pointer-events-none"
// //                     }`}
// //                   >
// //                     <button
// //                       onClick={() => (window.location.href = `/edit-task/${task._id}`)}
// //                       className="block w-full text-left px-4 py-2 hover:bg-blue-100"
// //                     >
// //                       Edit
// //                     </button>
// //                     <button
// //                       onClick={() => confirmDelete(task._id)}
// //                       className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-100"
// //                     >
// //                       Delete
// //                     </button>
// //                   </div>
// //                 </div>

// //                 {/* Task Icon */}
// //                 <div className="w-28 h-28 rounded-full overflow-hidden mb-4 border-4 border-blue-200 shadow-sm bg-blue-400 flex items-center justify-center">
// //                   <FiClock className="text-white text-4xl" />
// //                 </div>

// //                 <h2 className="text-2xl font-semibold text-blue-700">{task.title}</h2>
// //                 <span
// //                   className={`text-white px-3 py-1 rounded-full mt-1 ${
// //                     statusColors[task.status] || "bg-gray-500"
// //                   }`}
// //                 >
// //                   {task.status}
// //                 </span>

// //                 <p className="text-gray-500 text-sm mt-2">
// //                   {task.assignedTo?.name || "Unassigned"}
// //                 </p>
// //                 <p className="text-gray-500 text-sm">
// //                   {task.deadline || "No deadline"}
// //                 </p>
// //                 <p className="text-gray-500 text-sm">
// //                   Priority: {task.priority}
// //                 </p>

// //                 {/* Task Details */}
// //                 <div className="flex flex-col items-center mt-3 gap-1">
// //                   <div className="flex items-center gap-1 text-gray-600 text-sm">
// //                     <FiUser /> {task.assignedTo?.name || "Unassigned"}
// //                   </div>
// //                   <div className="flex items-center gap-1 text-gray-600 text-sm">
// //                     <FiCalendar /> {task.deadline || "No deadline"}
// //                   </div>
// //                 </div>
// //               </div>
// //             ))}
// //           </div>
// //         )}
// //       </div>

// //       {/* Delete Modal */}
// //       {modalOpen && (
// //         <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
// //           <div className="bg-white rounded-xl shadow-lg p-6 w-96 text-center animate-fadeIn">
// //             <h2 className="text-xl font-semibold text-red-600 mb-4">
// //               Confirm Delete
// //             </h2>
// //             <p className="mb-6">Are you sure you want to delete this task?</p>

// //             <div className="flex justify-center gap-4">
// //               <button
// //                 onClick={() => setModalOpen(false)}
// //                 className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
// //               >
// //                 Cancel
// //               </button>
// //               <button
// //                 onClick={handleDelete}
// //                 className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
// //               >
// //                 Delete
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       <Footer />
// //     </div>
// //   );
// // };

// // export default Tasks;
