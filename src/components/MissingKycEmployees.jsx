import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Footer from "./Footer";
import Toast from "./Toast";
import {
  FiSearch,
  FiUsers,
  FiAlertTriangle,
  FiExternalLink,
  FiDownload,
} from "react-icons/fi";

const api = axios.create({
  baseURL: "https://emsbackend-2w9c.onrender.com/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const badge = {
  not_submitted: "bg-red-100 text-red-700 border-red-200",
  incomplete: "bg-orange-100 text-orange-700 border-orange-200",
};

const MissingKycEmployees = () => {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await api.get("/kyc/missing");
      const data = res.data?.data || [];
      setList(data);
    } catch (err) {
      setToast({
        show: true,
        message:
          err.response?.data?.message || "Failed to load missing KYC employees",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return list;
    const q = search.trim().toLowerCase();
    return list.filter((x) => {
      const emp = x.employee || {};
      return (
        (emp.name || "").toLowerCase().includes(q) ||
        (emp.email || "").toLowerCase().includes(q) ||
        (emp.employeeId || "").toLowerCase().includes(q)
      );
    });
  }, [search, list]);

  // ✅ CSV download
  const downloadCSV = () => {
    try {
      if (!filtered.length) {
        setToast({
          show: true,
          message: "No data to export",
          type: "error",
        });
        return;
      }

      const rows = filtered.map((row, index) => {
        const emp = row.employee || {};
        return {
          "Sr No": index + 1,
          "Employee Name": emp.name || "-",
          "Employee ID": emp.employeeId || "-",
          Email: emp.email || "-",
          Phone: emp.phone || "-",
          Role: emp.role || "-",
          Department: emp.department || "-",
          Designation: emp.designation || "-",
          "KYC Status": row.kycStatus || "-",
        };
      });

      const headers = Object.keys(rows[0]);
      const csvContent = [
        headers.join(","),
        ...rows.map((r) =>
          headers
            .map((h) => {
              const val = String(r[h] ?? "").replaceAll('"', '""');
              return `"${val}"`;
            })
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `missing_kyc_employees_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      a.click();

      URL.revokeObjectURL(url);

      setToast({
        show: true,
        message: "✅ CSV downloaded successfully!",
        type: "success",
      });
    } catch (err) {
      setToast({
        show: true,
        message: "Failed to export CSV",
        type: "error",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <FiAlertTriangle className="text-orange-500" />
              Missing KYC Employees
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Employees who haven't submitted or completed KYC
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={downloadCSV}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-200"
            >
              <FiDownload /> Download CSV
            </button>

            <button
              onClick={() => navigate("/employees")}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
            >
              Back
            </button>
          </div>
        </div>

        {/* Search + total */}
        <div className="flex flex-col md:flex-row gap-3 items-center mb-6">
          <div className="relative w-full md:w-96">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <FiSearch />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="ml-auto flex items-center gap-2 text-sm text-slate-500 font-semibold">
            <FiUsers /> Total: {filtered.length}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-28">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
            <p className="mt-4 text-slate-500 text-sm animate-pulse">
              Loading employees...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
            <FiUsers className="mx-auto h-16 w-16 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">All employees have KYC ✅</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filtered.map((row) => {
                    const emp = row.employee;
                    return (
                      <tr
                        key={emp._id}
                        className="hover:bg-orange-50/30 transition duration-200"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">
                              {emp.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {emp.employeeId || emp._id.slice(-6)}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {emp.email}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-wide border ${
                              badge[row.kycStatus] || badge.incomplete
                            }`}
                          >
                            {row.kycStatus}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => navigate(`/employees/${emp._id}/kyc`)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow shadow-blue-200 hover:bg-blue-700 transition"
                          >
                            <FiExternalLink size={14} /> Add KYC
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
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

export default MissingKycEmployees;
