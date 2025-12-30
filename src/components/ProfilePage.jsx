import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import EditProfileModal from "./EditProfileModal";
import ChangePasswordModal from "./ChangePasswordModal";

const ProfilePage = () => {
  const [user, setUser] = useState({});
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [openPasswordModal, setOpenPasswordModal] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  // Save updated profile data
  const handleProfileSave = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  // Handle password change
  const handlePasswordSave = (passwordData) => {
    console.log("Password updated:", passwordData);
    // Optional: call API here
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Navbar */}
      <Navbar />

      {/* Modals */}
      <EditProfileModal
        isOpen={openProfileModal}
        onClose={() => setOpenProfileModal(false)}
        emp={user}
        onSave={handleProfileSave}
      />
      <ChangePasswordModal
        isOpen={openPasswordModal}
        onClose={() => setOpenPasswordModal(false)}
        onSave={handlePasswordSave}
        user={user}
      />

      {/* Profile Content */}
      <main className="flex-1 flex justify-center items-start py-16 px-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-400 to-sky-300 h-40 relative">
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-lg">
              {user.profileImage ? (
                <img
                  src={`http://localhost:5000/${user.profileImage}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-400 flex items-center justify-center text-white font-bold text-4xl">
                  {user.name?.charAt(0) || "?"}
                </div>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="mt-20 px-12 py-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-800">
                {user.name || "Employee Name"}
              </h2>
              <p className="text-gray-500 mt-2">
                {user.role?.toUpperCase() || "ROLE"}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
              {[
                ["Employee ID", user.employeeId],
                ["Email", user.email],
                ["Phone", user.phone],
                ["Joining Date", user.joining_date],
                ["Department", user.department],
                ["Designation", user.designation],
                ["Location", user.location],
                ["Address", user.address],
                ["Date of Birth", user.dob],
                ["Gender", user.gender],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b pb-3">
                  <span className="font-medium">{label}:</span>
                  <span className="text-gray-900">{value || "N/A"}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col md:flex-row gap-4 justify-center">
              <button
                onClick={() => setOpenProfileModal(true)}
                className="flex-1 py-3 bg-blue-600 text-black rounded-xl font-semibold hover:bg-red-400 transition"
              >
                Edit Profile
              </button>

              <button
                onClick={() => setOpenPasswordModal(true)}
                className="flex-1 py-3 border border-blue-300 text-sky-600 rounded-xl font-semibold hover:bg-blue-600 transition"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ProfilePage;










// import React, { useEffect, useState } from 'react';
// import Navbar from './Navbar';

// const ProfilePage = () => {
//   const [user, setUser] = useState({});

//   useEffect(() => {
//     const userData = localStorage.getItem('user');
//     if (userData) {
//       setUser(JSON.parse(userData));
//     }
//   }, []);

//   return (
//     <div className="min-h-screen bg-gray-100">
//       <Navbar />

//       <div className="flex justify-center items-start py-16 px-4">
//         <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden">
          
//           {/* Header */}
//           <div className="bg-gradient-to-r from-sky-400 to-sky-300 h-40 relative">
//             <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-lg">
//               <img
//                 src={user.profileImage || 'https://via.placeholder.com/150'}
//                 alt="Profile"
//                 className="w-full h-full object-cover"
//               />
//             </div>
//           </div>

//           {/* Profile Info */}
//           <div className="mt-20 px-12 py-8">
//             <div className="text-center">
//               <h2 className="text-3xl font-bold text-gray-800">{user.name || 'Employee Name'}</h2>
//               <p className="text-gray-500 mt-2">{user.role ? user.role.toUpperCase() : 'ROLE'}</p>
//             </div>

//             <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
//               <div className="flex justify-between border-b pb-3">
//                 <span className="font-medium">Employee ID:</span>
//                 <span className="text-gray-900">{user.employeeId || 'N/A'}</span>
//               </div>
//               <div className="flex justify-between border-b pb-3">
//                 <span className="font-medium">Email:</span>
//                 <span className="text-gray-900">{user.email || 'user@example.com'}</span>
//               </div>
//               <div className="flex justify-between border-b pb-3">
//                 <span className="font-medium">Phone:</span>
//                 <span className="text-gray-900">{user.phone || 'N/A'}</span>
//               </div>
//               <div className="flex justify-between border-b pb-3">
//                 <span className="font-medium">Joining Date:</span>
//                 <span className="text-gray-900">{user.joining_date || 'N/A'}</span>
//               </div>
//               <div className="flex justify-between border-b pb-3">
//                 <span className="font-medium">Department:</span>
//                 <span className="text-gray-900">{user.department || 'N/A'}</span>
//               </div>
//               <div className="flex justify-between border-b pb-3">
//                 <span className="font-medium">Designation:</span>
//                 <span className="text-gray-900">{user.designation || 'N/A'}</span>
//               </div>
//               <div className="flex justify-between border-b pb-3">
//                 <span className="font-medium">Location:</span>
//                 <span className="text-gray-900">{user.location || 'N/A'}</span>
//               </div>
//               <div className="flex justify-between border-b pb-3">
//                 <span className="font-medium">Address:</span>
//                 <span className="text-gray-900">{user.address || 'N/A'}</span>
//               </div>
//               <div className="flex justify-between border-b pb-3">
//                 <span className="font-medium">Date of Birth:</span>
//                 <span className="text-gray-900">{user.dob || 'N/A'}</span>
//               </div>
//               <div className="flex justify-between border-b pb-3">
//                 <span className="font-medium">Gender:</span>
//                 <span className="text-gray-900">{user.gender || 'N/A'}</span>
//               </div>
//             </div>

//             {/* Action Buttons */}
//             <div className="mt-8 flex flex-col md:flex-row gap-4 justify-center">
//               <button className="flex-1 py-3 bg-blue-600 text-black rounded-xl font-semibold hover:bg-red-400 transition">
//                 Edit Profile
//               </button>
//               <button className="flex-1 py-3 border border-blue-300 text-sky-600 rounded-xl font-semibold hover:bg-blue-600 transition">
//                 Change Password
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProfilePage;
