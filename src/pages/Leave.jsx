import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { FiMoreVertical, FiX } from "react-icons/fi";

/* ---------- STATUS COLORS ---------- */
const statusColors = {
  Approved: "bg-green-500",
  Pending: "bg-yellow-500",
  Rejected: "bg-red-500",
};

/* ---------- FIXED LEAVE QUOTA ---------- */
const TOTAL_LEAVES = 4;

/* ---------- LEAVE ID ---------- */
const generateLeaveId = () => {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${mm}${dd}${random}`;
};

const today = new Date().toISOString().split("T")[0];

const Leave = () => {
  const [leaves, setLeaves] = useState([]);
  const [showDropdown, setShowDropdown] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  /* ---------- FILTER ---------- */
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* ---------- USER ---------- */
  const role = localStorage.getItem("role");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const employeeId = user.employeeId;
  const employeeName = user.name;

  /* ---------- ADD LEAVE ---------- */
  const [newLeave, setNewLeave] = useState({
    type: "Sick Leave",
    from: "",
    to: "",
    reason: "",
  });

  /* ---------- FETCH ---------- */
  const fetchLeaves = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/leaves");
      const data = res.data || [];
      setLeaves(role === "employee"
        ? data.filter(l => l.employee_id === employeeId)
        : data
      );
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  /* ---------- COUNTS ---------- */
  const usedLeaves = leaves.filter(l => l.status === "Approved").length;
  const remainingLeaves = Math.max(TOTAL_LEAVES - usedLeaves, 0);

  /* ---------- FILTER LOGIC ---------- */
  const filteredLeaves = leaves.filter(l => {
    if (
      search &&
      !l.employee_name.toLowerCase().includes(search.toLowerCase()) &&
      !String(l.leave_id).includes(search)
    ) return false;

    if (typeFilter !== "All" && l.type !== typeFilter) return false;
    if (statusFilter !== "All" && l.status !== statusFilter) return false;
    if (fromDate && new Date(l.from) < new Date(fromDate)) return false;
    if (toDate && new Date(l.to) > new Date(toDate)) return false;

    return true;
  });

  /* ---------- ADD LEAVE ---------- */
  const handleAddLeave = async (e) => {
    e.preventDefault();
    await axios.post("http://localhost:5000/api/leaves", {
      leave_id: generateLeaveId(),
      employee_id: employeeId,
      employee_name: employeeName,
      ...newLeave,
      status: "Pending",
    });
    setShowAddModal(false);
    setNewLeave({ type: "Sick Leave", from: "", to: "", reason: "" });
    fetchLeaves();
  };

  /* ---------- UPDATE STATUS ---------- */
  const updateStatus = async (id, status) => {
    await axios.patch(`http://localhost:5000/api/leaves/${id}`, { status });
    setShowDropdown(null);
    fetchLeaves();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col">
      <Navbar />

      <div className="p-6 max-w-7xl mx-auto flex-1 w-full">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-700">Leave Requests</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-full bg-blue-600 text-white"
          >
            + Add Leave
          </button>
        </div>

        {/* EMPLOYEE SUMMARY */}
        {role === "employee" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow">
              <p>Total Leaves</p>
              <p className="text-2xl font-bold">{TOTAL_LEAVES}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow">
              <p>Used Leaves</p>
              <p className="text-2xl font-bold text-green-600">{usedLeaves}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow">
              <p>Remaining Leaves</p>
              <p className="text-2xl font-bold text-orange-600">{remainingLeaves}</p>
            </div>
          </div>
        )}

        {/* FILTER BAR (BIG BAR) */}
        <div className="bg-white p-4 rounded-xl shadow mb-6 flex flex-wrap gap-3">
          <input
            placeholder="Search employee or leave ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-4 py-2 border rounded-full w-60"
          />

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-4 py-2 border rounded-full"
          >
            <option value="All">All Types</option>
            <option>Sick Leave</option>
            <option>Casual Leave</option>
            <option>Paid Leave</option>
            <option>Other</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-full"
          >
            <option value="All">All Status</option>
            <option>Approved</option>
            <option>Pending</option>
            <option>Rejected</option>
          </select>

          <input
            type="date"
            min={today}
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="px-3 py-2 border rounded-full"
          />

          <input
            type="date"
            min={today}
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="px-3 py-2 border rounded-full"
          />
        </div>

        {/* LEAVE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeaves.map(leave => (
            <div key={leave._id} className="bg-white p-6 rounded-xl shadow relative">
              {role !== "employee" && (
  <>
    <button
      className="absolute top-4 right-4"
      onClick={() =>
        setShowDropdown(showDropdown === leave._id ? null : leave._id)
      }
    >
      <FiMoreVertical />
    </button>

    {showDropdown === leave._id && (
      <div className="absolute top-12 right-4 bg-white border rounded-lg shadow-lg z-20 w-32">
        <button
          onClick={() => updateStatus(leave._id, "Approved")}
          className="w-full px-4 py-2 text-left hover:bg-green-100 text-green-700"
        >
          Approve
        </button>

        <button
          onClick={() => updateStatus(leave._id, "Rejected")}
          className="w-full px-4 py-2 text-left hover:bg-red-100 text-red-700"
        >
          Reject
        </button>
      </div>
    )}
  </>
)}


              <h2 className="font-semibold text-blue-700">{leave.employee_name}</h2>
              <p className="text-sm">Leave ID: <b>{leave.leave_id}</b></p>
              <p className="text-sm">
                {new Date(leave.from).toLocaleDateString()} →{" "}
                {new Date(leave.to).toLocaleDateString()}
              </p>
              <p className="text-sm mt-2">{leave.reason}</p>

              <span className={`inline-block mt-3 px-4 py-1 text-white rounded-full ${statusColors[leave.status]}`}>
                {leave.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ADD LEAVE MODAL (UNCHANGED) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Request Leave</h2>
              <button onClick={() => setShowAddModal(false)}><FiX /></button>
            </div>

            <form onSubmit={handleAddLeave} className="space-y-4">
              <input value={employeeName || ""} disabled className="w-full px-4 py-2 border bg-gray-100 rounded" />

              <select
                value={newLeave.type}
                onChange={e => setNewLeave({ ...newLeave, type: e.target.value })}
                className="w-full px-4 py-2 border rounded"
              >
                <option>Sick Leave</option>
                <option>Casual Leave</option>
                <option>Paid Leave</option>
                <option>Other</option>
              </select>

              <input type="date" min={today} required className="w-full px-4 py-2 border rounded"
                onChange={e => setNewLeave({ ...newLeave, from: e.target.value })}
              />

              <input type="date" min={today} required className="w-full px-4 py-2 border rounded"
                onChange={e => setNewLeave({ ...newLeave, to: e.target.value })}
              />

              <textarea required placeholder="Reason" className="w-full px-4 py-2 border rounded"
                onChange={e => setNewLeave({ ...newLeave, reason: e.target.value })}
              />

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Leave;