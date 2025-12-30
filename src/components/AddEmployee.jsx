import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaEye, FaEyeSlash, FaRegCopy } from "react-icons/fa";
import Swal from "sweetalert2";
import axios from "axios";
import Navbar from "./Navbar";
import Footer from "./Footer";

// ============================
// Constant Lists
// ============================
const departments = [
  "Engineering","HR","Finance","Marketing","Sales","Operations","IT Support","Customer Service",
  "Logistics","Legal","Procurement","R&D","Quality","Admin","Production","Maintenance","Design",
  "Training","Compliance","Analytics","Strategy","Security","Public Relations","Facilities",
  "Health & Safety","UX/UI","Data Science","Content","Business Development","Innovation"
];

const designations = [
  "Manager","Senior Engineer","Junior Engineer","Intern","Team Lead","HR Executive","Backend Engineer",
  "Cloud Engineer","Junior HR","Senior HR","Fullstack Engineer","Finance Analyst","Marketing Specialist",
  "Sales Associate","Operations Manager","IT Support Engineer","Customer Support Rep","Logistics Coordinator",
  "Legal Advisor","Procurement Officer","R&D Scientist","Quality Analyst","Admin Assistant",
  "Production Supervisor","Maintenance Technician","Designer","Trainer","Compliance Officer",
  "Data Analyst","Strategy Consultant","Security Officer","PR Executive","Facilities Manager",
  "Safety Officer","Content Writer","Business Developer","Innovation Lead","UX Designer","UI Designer",
  "Data Engineer","Product Manager","Software Engineer","Network Engineer","DevOps Engineer",
  "Database Admin","AI Specialist","Machine Learning Engineer","Cybersecurity Analyst","Marketing Manager",
  "Sales Manager","Operations Executive","HR Manager","Finance Manager","Legal Manager",
  "Customer Success Manager"
];

const roles = ["admin", "manager", "employee", "hr"];

// ============================
// AddEmployee Component
// ============================
const AddEmployee = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    employeeId: "",
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    dob: null,
    joiningDate: null,
    password: "",
    confirmPassword: "",
    department: "",
    designation: "",
    role: "",
    profileImage: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ============================
  // Generate Employee ID yymm + 4 digits
  // ============================
  const generateEmployeeId = (joiningDate) => {
    if (!joiningDate) return "";
    const year = String(joiningDate.getFullYear()).slice(-2);
    const month = String(joiningDate.getMonth() + 1).padStart(2, "0");
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${year}${month}${randomNum}`;
  };

  // ============================
  // Input Change Handler
  // ============================
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profileImage") {
      setFormData((prev) => ({ ...prev, profileImage: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ============================
  // Date Handler
  // ============================
  const handleDateChange = (date, field) => {
    if (field === "joiningDate") {
      const empId = generateEmployeeId(date);
      setFormData((prev) => ({ ...prev, joiningDate: date, employeeId: empId }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: date }));
    }
  };

  // ============================
  // Role Handler
  // ============================
  const HandleRole = (value) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  // ============================
  // Copy Employee ID
  // ============================
  const copyEmpId = async () => {
    if (!formData.employeeId) return;
    await navigator.clipboard.writeText(formData.employeeId);
    Swal.fire({ icon: "success", title: "Copied!", text: "Employee ID copied", timer: 1500, showConfirmButton: false });
  };

  // ============================
  // Validate Form
  // ============================
  const validateForm = () => {
    const { fullName, email, phone, gender, dob, joiningDate, password, confirmPassword, department, designation, role } = formData;

    if (!fullName) return "Full Name is required";
    if (!email) return "Email is required";
    if (!phone) return "Phone number is required";
    if (!gender) return "Gender is required";
    if (!dob) return "Date of Birth is required";
    if (!joiningDate) return "Joining Date is required";
    if (!department) return "Department is required";
    if (!designation) return "Designation is required";
    if (!role) return "Role is required";
    if (!password) return "Password is required";
    if (password !== confirmPassword) return "Passwords do not match";

    return null;
  };

  // ============================
  // Submit Handler
  // ============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const error = validateForm();
    if (error) {
      Swal.fire({ icon: "error", title: "Validation Error", text: error });
      return;
    }

    const confirm = await Swal.fire({
      title: "Confirm Employee Details",
      html: `
        <strong>Employee ID:</strong> ${formData.employeeId} <br/>
        <strong>Name:</strong> ${formData.fullName} <br/>
        <strong>Email:</strong> ${formData.email} <br/>
        <strong>Phone:</strong> ${formData.phone} <br/>
        <strong>Gender:</strong> ${formData.gender} <br/>
        <strong>DOB:</strong> ${formData.dob?.toLocaleDateString()} <br/>
        <strong>Joining Date:</strong> ${formData.joiningDate?.toLocaleDateString()} <br/>
        <strong>Department:</strong> ${formData.department} <br/>
        <strong>Designation:</strong> ${formData.designation} <br/>
        <strong>Role:</strong> ${formData.role} <br/>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Confirm",
    });

    if (!confirm.isConfirmed) return;

    const data = new FormData();
    data.append("employeeId", formData.employeeId);
    data.append("name", formData.fullName);
    data.append("email", formData.email);
    data.append("phone", formData.phone);
    data.append("role", formData.role);
    data.append("password", formData.password);
    data.append("department", formData.department);
    data.append("designation", formData.designation);
    data.append("gender", formData.gender);
    data.append("dob", formData.dob?.toISOString());
    data.append("joining_date", formData.joiningDate?.toISOString());
    if (formData.profileImage) data.append("profileImage", formData.profileImage);

    try {
      const res = await axios.post("http://localhost:5000/api/users/register", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Swal.fire({
        icon: "success",
        title: "Employee Added",
        text: `Employee ${res.data.user.name} added successfully!`,
      });

      setFormData({
        employeeId: "",
        fullName: "",
        email: "",
        phone: "",
        gender: "",
        dob: null,
        joiningDate: null,
        password: "",
        confirmPassword: "",
        department: "",
        designation: "",
        role: "",
        profileImage: null,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Something went wrong",
      });
    }
  };

  // ============================
  // UI Starts
  // ============================
  return (
    <div>
      <Navbar />

      <div className="min-h-screen bg-blue-100 flex justify-center items-center px-4 py-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl space-y-6"
        >
          <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">
            Add New Employee
          </h2>

          {/* EMPLOYEE ID */}
          <div>
            <label className="font-semibold">Employee ID</label>
            <div className="relative">
              <input type="text" value={formData.employeeId} readOnly className="w-full p-3 bg-gray-200 rounded" />
              <FaRegCopy
                onClick={copyEmpId}
                className="absolute right-3 top-3 cursor-pointer"
                title="Copy ID"
              />
            </div>
          </div>

          {/* FULL NAME + EMAIL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold">Full Name</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full p-3 border rounded" />
            </div>
            <div>
              <label className="font-semibold">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-3 border rounded" />
            </div>
          </div>

          {/* PHONE + GENDER */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold">Phone Number</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-3 border rounded" />
            </div>
            <div>
              <label className="font-semibold">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-3 border rounded bg-white">
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* DOB + JOINING DATE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold">Date of Birth</label>
              <DatePicker
                selected={formData.dob}
                onChange={(date) => handleDateChange(date, "dob")}
                dateFormat="dd/MM/yyyy"
                className="w-full p-3 border rounded"
              />
            </div>
            <div>
              <label className="font-semibold">Joining Date</label>
              <DatePicker
                selected={formData.joiningDate}
                onChange={(date) => handleDateChange(date, "joiningDate")}
                dateFormat="dd/MM/yyyy"
                className="w-full p-3 border rounded"
              />
            </div>
          </div>

          {/* DEPARTMENT + DESIGNATION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold">Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full p-3 border rounded bg-white"
              >
                <option value="">Select Department</option>
                {departments.map((d, i) => (
                  <option key={i} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold">Designation</label>
              <select
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                className="w-full p-3 border rounded bg-white"
              >
                <option value="">Select Designation</option>
                {designations.map((d, i) => (
                  <option key={i} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ROLE */}
          <div>
            <label className="font-semibold">Role</label>
            <select
              value={formData.role}
              onChange={(e) => HandleRole(e.target.value)}
              className="w-full p-3 border rounded bg-white"
            >
              <option value="">Select Role</option>
              {roles.map((r, i) => (
                <option key={i} value={r}>{r.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* PASSWORD + CONFIRM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className="w-full p-3 border rounded" />
                <span className="absolute right-3 top-3 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>
            <div>
              <label className="font-semibold">Confirm Password</label>
              <div className="relative">
                <input type={showConfirm ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full p-3 border rounded" />
                <span className="absolute right-3 top-3 cursor-pointer" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>
          </div>

          {/* PROFILE IMAGE */}
          <div>
            <label className="font-semibold">Profile Image</label>
            <input type="file" name="profileImage" onChange={handleChange} className="w-full p-3 border rounded" />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Add Employee
            </button>
            <button
              type="button"
              onClick={() => navigate('/employees')}
              className="flex-1 bg-white text-blue-600 border-2 border-blue-600 font-semibold py-3 rounded-lg hover:bg-blue-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default AddEmployee;
