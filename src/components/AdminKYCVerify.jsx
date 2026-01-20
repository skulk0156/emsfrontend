import React, { useEffect, useState } from "react";
import axios from "axios";

import Footer from "./Footer";
import Toast from "./Toast";

import {
  FiShield,
  FiSearch,
  FiEye,
  FiCheck,
  FiX,
  FiClock,
  FiUser,
  FiMail,
  FiPhone,
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

const statusBadge = {
  pending: "bg-orange-100 text-orange-700 border-orange-200",
  verified: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const safeDocUrl = (path) => {
  if (!path) return "";
  return `https://emsbackend-2w9c.onrender.com${path}`;
};

const AdminKYCVerify = () => {
  const [kycList, setKycList] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [viewKyc, setViewKyc] = useState(null);
  const [remarks, setRemarks] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const fetchKycList = async () => {
    try {
      setLoading(true);
      const res = await api.get("/kyc?status=pending");
      const list = res.data?.kycList || [];
      setKycList(list);
      setFiltered(list);
    } catch (err) {
      setToast({
        show: true,
        message: err.response?.data?.message || "Failed to load KYC list",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycList();
  }, []);

  useEffect(() => {
    if (!search) setFiltered(kycList);
    else {
      const q = search.toLowerCase();
      setFiltered(
        kycList.filter((k) => {
          const emp = k.employeeId || {};
          return (
            (emp.name || "").toLowerCase().includes(q) ||
            (emp.email || "").toLowerCase().includes(q) ||
            (emp.employeeId || "").toLowerCase().includes(q)
          );
        })
      );
    }
  }, [search, kycList]);

  const updateStatus = async (employeeMongoId, status) => {
    try {
      setSubmitting(true);
      await api.patch(`/kyc/${employeeMongoId}/verify`, {
        status,
        remarks,
      });

      setToast({
        show: true,
        message: `✅ KYC ${status.toUpperCase()} successfully`,
        type: "success",
      });

      setRemarks("");
      setViewKyc(null);
      fetchKycList();
    } catch (err) {
      setToast({
        show: true,
        message: err.response?.data?.message || "Failed to update KYC status",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const DocItem = ({ title, filePath }) => {
    if (!filePath) {
      return (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            {title}
          </p>
          <p className="text-xs text-slate-400">Not uploaded</p>
        </div>
      );
    }

    return (
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className="text-sm font-semibold text-slate-700 truncate max-w-[180px]">
            Uploaded ✅
          </p>
        </div>
        <a
          href={safeDocUrl(filePath)}
          target="_blank"
          rel="noreferrer"
          className="px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition flex items-center gap-2"
        >
          <FiEye /> View
        </a>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <FiShield className="text-blue-600" />
              Admin KYC Verify Panel
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Verify pending KYCs submitted by employees
            </p>
          </div>

          <button
            onClick={fetchKycList}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center gap-2"
          >
            <FiClock /> Refresh Pending
          </button>
        </div>

        {/* Search + stats */}
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

          <div className="ml-auto text-sm text-slate-500 font-semibold">
            Pending: <span className="text-slate-800 font-bold">{filtered.length}</span>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-28">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
            <p className="mt-4 text-slate-500 text-sm animate-pulse">Loading pending KYC...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
            <FiShield className="mx-auto h-16 w-16 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No pending KYC requests ✅</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filtered.map((k) => {
                    const emp = k.employeeId || {};
                    return (
                      <tr key={k._id} className="hover:bg-orange-50/30 transition duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md text-xs shrink-0 overflow-hidden">
                              {emp.profileImage ? (
                                <img
                                  src={`https://emsbackend-2w9c.onrender.com${emp.profileImage}`}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                (emp.name || "U").charAt(0).toUpperCase()
                              )}
                            </div>

                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 text-sm">{emp.name || "Employee"}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {emp.employeeId || emp._id || "-"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <FiMail size={10} className="text-blue-400" />
                              {emp.email || "-"}
                            </span>
                            <span className="flex items-center gap-1 text-slate-400">
                              <FiPhone size={10} className="text-green-400" />
                              {emp.phone || "N/A"}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-wide border ${
                              statusBadge[k.status] || statusBadge.pending
                            }`}
                          >
                            {k.status || "pending"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setViewKyc(k);
                              setRemarks(k.remarks || "");
                            }}
                            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow shadow-blue-200 flex items-center gap-2 inline-flex"
                          >
                            <FiEye size={14} /> View & Verify
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

      {/* ✅ Modal */}
      {viewKyc && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-xl p-4 sm:p-6 transition-opacity duration-300"
          style={{
            background:
              "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 58, 138, 0.75) 50%, rgba(15, 23, 42, 0.95) 100%)",
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-white shrink-0 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <FiUser size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Verify KYC</h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Employee: {viewKyc.employeeId?.name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewKyc(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-red-500 transition shrink-0"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-col lg:flex-row h-full overflow-hidden">
              {/* Left */}
              <div className="w-full lg:w-1/3 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 p-6 flex flex-col gap-5 shrink-0">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Basic Info
                  </p>

                  <div className="space-y-2 text-sm text-slate-700">
                    <p><span className="font-semibold">Name:</span> {viewKyc.employeeId?.name}</p>
                    <p><span className="font-semibold">Email:</span> {viewKyc.employeeId?.email}</p>
                    <p><span className="font-semibold">Phone:</span> {viewKyc.employeeId?.phone || "N/A"}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    KYC Values
                  </p>
                  <div className="space-y-2 text-sm text-slate-700">
                    <p><span className="font-semibold">Aadhaar:</span> {viewKyc.aadhaarNumber || "-"}</p>
                    <p><span className="font-semibold">PAN:</span> {viewKyc.panNumber || "-"}</p>
                    <p><span className="font-semibold">Bank:</span> {viewKyc.bankName || "-"}</p>
                    <p><span className="font-semibold">Account:</span> {viewKyc.accountNumber || "-"}</p>
                    <p><span className="font-semibold">IFSC:</span> {viewKyc.ifscCode || "-"}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Remarks
                  </p>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add remarks (optional)"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-sm"
                  />
                </div>
              </div>

              {/* Right */}
              <div className="w-full lg:w-2/3 p-6 bg-white flex flex-col h-full overflow-y-auto custom-scrollbar gap-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                  Documents
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DocItem title="Aadhaar Front" filePath={viewKyc.documents?.aadhaarFront} />
                  <DocItem title="Aadhaar Back" filePath={viewKyc.documents?.aadhaarBack} />
                  <DocItem title="PAN Card" filePath={viewKyc.documents?.panCard} />
                  <DocItem title="Passbook" filePath={viewKyc.documents?.passbook} />
                  <DocItem title="Photo" filePath={viewKyc.documents?.photo} />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => updateStatus(viewKyc.employeeId?._id, "rejected")}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 shadow-lg shadow-red-200 transition-all flex items-center gap-2 text-sm disabled:opacity-60"
              >
                <FiX size={18} /> Reject
              </button>

              <button
                onClick={() => updateStatus(viewKyc.employeeId?._id, "verified")}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 shadow-lg shadow-green-200 transition-all flex items-center gap-2 text-sm disabled:opacity-60"
              >
                <FiCheck size={18} /> Verify
              </button>
            </div>
          </div>
        </div>
      )}

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

export default AdminKYCVerify;
