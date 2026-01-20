import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

import Footer from "../components/Footer";
import Toast from "../components/Toast";

import {
  FiUser,
  FiFileText,
  FiUploadCloud,
  FiCheckCircle,
  FiX,
  FiArrowLeft,
  FiEye,
  FiShield,
} from "react-icons/fi";

const api = axios.create({
  baseURL: "https://emsbackend-2w9c.onrender.com/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const EmployeeKYC = () => {
  const navigate = useNavigate();
  const { employeeId } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [kyc, setKyc] = useState(null);

  // ✅ KYC Form
  const [form, setForm] = useState({
    aadhaarNumber: "",
    panNumber: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    address: "",
  });

  // ✅ docs
  const [files, setFiles] = useState({
    aadhaarFront: null,
    aadhaarBack: null,
    panCard: null,
    passbook: null,
    photo: null,
  });

  // ✅ preview existing docs
  const [existingDocs, setExistingDocs] = useState({});

  const safeDocUrl = (path) => {
    if (!path) return "";
    return `https://emsbackend-2w9c.onrender.com${path}`;
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFile = (e) => {
    const { name, files: picked } = e.target;
    if (!picked || !picked[0]) return;
    setFiles((prev) => ({ ...prev, [name]: picked[0] }));
  };

  const fetchKyc = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/kyc/${employeeId}`);
      const kycData = res.data?.kyc || null;
      setKyc(kycData);

      if (kycData) {
        setForm({
          aadhaarNumber: kycData.aadhaarNumber || "",
          panNumber: kycData.panNumber || "",
          bankName: kycData.bankName || "",
          accountNumber: kycData.accountNumber || "",
          ifscCode: kycData.ifscCode || "",
          address: kycData.address || "",
        });

        setExistingDocs(kycData.documents || {});
      } else {
        setExistingDocs({});
      }
    } catch (err) {
      // if not found -> no issue
      setKyc(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKyc();
    // eslint-disable-next-line
  }, [employeeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const payload = new FormData();

      // ✅ append fields
      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined && v !== null) payload.append(k, v);
      });

      // ✅ append files
      Object.entries(files).forEach(([k, f]) => {
        if (f) payload.append(k, f);
      });

      const res = await api.post(`/kyc/${employeeId}`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setToast({
        show: true,
        message: res.data?.message || "✅ KYC saved successfully!",
        type: "success",
      });

      fetchKyc();
    } catch (err) {
      setToast({
        show: true,
        message: err.response?.data?.message || "Failed to save KYC",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const StatusBadge = ({ status }) => {
    const s = (status || "pending").toLowerCase();

    const styles = {
      pending: "bg-orange-100 text-orange-700 border-orange-200",
      verified: "bg-green-100 text-green-700 border-green-200",
      rejected: "bg-red-100 text-red-700 border-red-200",
    };

    return (
      <span
        className={`text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-wide border ${
          styles[s] || styles.pending
        }`}
      >
        {s}
      </span>
    );
  };

  const UploadCard = ({ label, name }) => {
    const hasNew = !!files[name];
    const hasOld = !!existingDocs?.[name];

    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>

          {(hasOld || hasNew) && (
            <a
              href={hasNew ? URL.createObjectURL(files[name]) : safeDocUrl(existingDocs[name])}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <FiEye /> View
            </a>
          )}
        </div>

        <label className="w-full cursor-pointer">
          <div
            className={`w-full px-4 py-3 rounded-xl border border-dashed transition flex items-center justify-center gap-2 text-sm ${
              hasNew
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FiUploadCloud />
            {hasNew ? files[name]?.name : "Upload file"}
          </div>

          <input
            type="file"
            name={name}
            className="hidden"
            onChange={handleFile}
            accept="image/*,.pdf"
          />
        </label>

        {hasOld && !hasNew && (
          <p className="text-[11px] text-slate-400">
            Already uploaded ✅ (Upload again to replace)
          </p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <FiShield className="text-blue-600" />
              Employee KYC Details
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Fill KYC details and upload documents for verification
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition flex items-center gap-2"
            >
              <FiArrowLeft /> Back
            </button>

            <StatusBadge status={kyc?.status || "pending"} />
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
        >
          {/* Section: Basic */}
          <div className="p-6 md:p-8 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <FiUser size={18} />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Identity Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Aadhaar Number
                </label>
                <input
                  type="text"
                  name="aadhaarNumber"
                  value={form.aadhaarNumber}
                  onChange={handleChange}
                  placeholder="Enter Aadhaar Number"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  PAN Number
                </label>
                <input
                  type="text"
                  name="panNumber"
                  value={form.panNumber}
                  onChange={handleChange}
                  placeholder="Enter PAN Number"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Address
                </label>
                <textarea
                  rows={2}
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Enter full address"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section: Bank */}
          <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <FiFileText size={18} />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Bank Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={form.bankName}
                  onChange={handleChange}
                  placeholder="Enter Bank Name"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={form.accountNumber}
                  onChange={handleChange}
                  placeholder="Enter Account Number"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  IFSC Code
                </label>
                <input
                  type="text"
                  name="ifscCode"
                  value={form.ifscCode}
                  onChange={handleChange}
                  placeholder="Enter IFSC Code"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section: Docs */}
          <div className="p-6 md:p-8 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <FiUploadCloud size={18} />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Upload Documents</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <UploadCard label="Aadhaar Front" name="aadhaarFront" />
              <UploadCard label="Aadhaar Back" name="aadhaarBack" />
              <UploadCard label="PAN Card" name="panCard" />
              <UploadCard label="Passbook / Bank Proof" name="passbook" />
              <UploadCard label="Passport Photo" name="photo" />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 md:px-8 py-6 bg-white border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all text-sm flex items-center gap-2"
            >
              <FiX /> Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 text-sm disabled:opacity-60"
            >
              {submitting ? "Saving..." : <><FiCheckCircle size={18} /> Save KYC</>}
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

export default EmployeeKYC;
