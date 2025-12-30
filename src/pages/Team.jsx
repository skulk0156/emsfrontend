import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiMoreVertical, FiUsers } from "react-icons/fi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Toast from "../components/Toast";

const roleColors = {
  ADMIN: "bg-red-500",
  HR: "bg-green-500",
  EMPLOYEE: "bg-blue-500",
  MANAGER: "bg-yellow-500",
  DEFAULT: "bg-gray-500",
};

const Team = () => {
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTeamId, setDeleteTeamId] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role") || "";
    setUserRole(role.toLowerCase());
  }, []);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/teams", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setTeams(res.data);
        setFilteredTeams(res.data);
      } catch (err) {
        setError("Failed to fetch teams");
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  useEffect(() => {
    if (!search) setFilteredTeams(teams);
    else {
      setFilteredTeams(
        teams.filter(
          (team) =>
            (team.team_name || "").toLowerCase().includes(search.toLowerCase()) ||
            (team.team_leader?.name || "").toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, teams]);

  const confirmDelete = (id) => {
    setDeleteTeamId(id);
    setModalOpen(true);
    setDropdownOpen(null);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/teams/${deleteTeamId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setTeams((prev) => prev.filter((team) => team._id !== deleteTeamId));
      setFilteredTeams((prev) => prev.filter((team) => team._id !== deleteTeamId));
      setModalOpen(false);
      setToast({ show: true, message: 'Team deleted successfully!', type: 'success' });
    } catch (err) {
      setToast({ show: true, message: 'Failed to delete team.', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-blue-100">
      <Navbar />

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* --- UPDATED SECTION --- */}
        {/* Added flex-grow to heading and margin-left to search/add team container for more horizontal space */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 w-full">
          <h1 className="text-4xl font-extrabold text-blue-700 flex-grow">Our Teams</h1>
          <div className="flex gap-3 flex-col sm:flex-row w-full sm:w-auto ml-8">
            {(userRole === "admin" || userRole === "manager") && (
              <input
                type="text"
                placeholder="Search teams or leaders..."
                className="px-4 py-2 rounded-full shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1 sm:w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            )}
            {userRole === "admin" && (
              <button
                onClick={() => navigate("/add-team")}
                className="bg-blue-600 text-white px-5 py-2 rounded-full shadow-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                + Add Team
              </button>
            )}
          </div>
        </div>

        {/* Loading / Error */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
          </div>
        ) : error ? (
          <p className="text-red-500 text-center text-lg">{error}</p>
        ) : filteredTeams.length === 0 ? (
          <p className="text-gray-600 text-center text-lg mt-10">No teams found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filteredTeams.map((team, index) => (
              <div
                key={team._id}
                className="relative bg-white rounded-3xl shadow-md p-6 flex flex-col items-center text-center border border-blue-200 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-fadeIn"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Dropdown */}
                {userRole === "admin" && (
                  <div className="absolute top-4 right-4">
                    <button
                      className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition"
                      onClick={() =>
                        setDropdownOpen(dropdownOpen === team._id ? null : team._id)
                      }
                    >
                      <FiMoreVertical />
                    </button>
                    <div
                      className={`absolute right-0 mt-2 w-32 bg-white border border-gray-300 rounded-md shadow-lg z-10 overflow-hidden transition-all duration-300 ${
                        dropdownOpen === team._id
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-95 pointer-events-none"
                      }`}
                    >
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-blue-100"
                        onClick={() => navigate(`/edit-team/${team._id}`)}
                      >
                        Edit
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 hover:bg-red-100 text-red-600"
                        onClick={() => confirmDelete(team._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* Team Icon */}
                <div className="w-28 h-28 rounded-full overflow-hidden mb-4 border-4 border-blue-200 shadow-sm bg-blue-400 flex items-center justify-center"> 
                  <FiUsers className="text-white text-4xl" />
                </div>

                <h2 className="text-2xl font-semibold text-blue-700">{team.team_name || "Unnamed Team"}</h2>
                
                {/* Team Leader Badge */}
                <div className="mt-2">
                  {team.team_leader ? (
                    <span className={`text-white px-3 py-1 rounded-full ${
                      roleColors[team.team_leader.role?.toUpperCase()] || roleColors.DEFAULT
                    }`}>
                      LEADER: {team.team_leader.role?.toUpperCase()}
                    </span>
                  ) : (
                    <span className="text-gray-500 px-3 py-1 rounded-full bg-gray-200">
                      NO LEADER
                    </span>
                  )}
                </div>

                <p className="text-gray-500 text-sm mt-2">
                  {team.team_leader ? team.team_leader.name : "No leader assigned"}
                </p>
                <p className="text-gray-500 text-sm">
                  Members: {team.members?.length || 0}
                </p>

                {/* Members List */}
                <div className="flex flex-col items-center mt-3 gap-1 max-h-24 overflow-y-auto w-full">
                  {team.members && team.members.length > 0 ? (
                    team.members.slice(0, 3).map((m) => (
                      <div key={m._id} className="text-gray-600 text-sm">
                        {m.employee ? m.employee.name : "Unknown"}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-sm italic">No members</div>
                  )}
                  {team.members && team.members.length > 3 && (
                    <div className="text-blue-600 text-sm font-medium">
                      +{team.members.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-6 w-96 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-4">Confirm Delete</h2>
            <p className="mb-6">Are you sure you want to delete this team?</p>
            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                onClick={handleDelete}
              >
                Delete
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

export default Team;








// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import { FiMoreVertical, FiUsers } from "react-icons/fi";
// import Navbar from "../components/Navbar";
// import Footer from "../components/Footer";

// const roleColors = {
//   ADMIN: "bg-red-500",
//   HR: "bg-green-500",
//   EMPLOYEE: "bg-blue-500",
//   MANAGER: "bg-yellow-500",
//   DEFAULT: "bg-gray-500",
// };

// const Team = () => {
//   const [teams, setTeams] = useState([]);
//   const [filteredTeams, setFilteredTeams] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [search, setSearch] = useState("");
//   const [dropdownOpen, setDropdownOpen] = useState(null);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [deleteTeamId, setDeleteTeamId] = useState(null);
//   const [userRole, setUserRole] = useState("");
//   const navigate = useNavigate();

//   useEffect(() => {
//     const role = localStorage.getItem("role") || "";
//     setUserRole(role.toLowerCase());
//   }, []);

//   useEffect(() => {
//     const fetchTeams = async () => {
//       try {
//         const res = await axios.get("http://localhost:5000/api/teams", {
//           headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//         });
//         setTeams(res.data);
//         setFilteredTeams(res.data);
//       } catch (err) {
//         setError("Failed to fetch teams");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchTeams();
//   }, []);

//   useEffect(() => {
//     if (!search) setFilteredTeams(teams);
//     else {
//       setFilteredTeams(
//         teams.filter(
//           (team) =>
//             (team.team_name || "").toLowerCase().includes(search.toLowerCase()) ||
//             (team.team_leader?.name || "").toLowerCase().includes(search.toLowerCase())
//         )
//       );
//     }
//   }, [search, teams]);

//   const confirmDelete = (id) => {
//     setDeleteTeamId(id);
//     setModalOpen(true);
//     setDropdownOpen(null);
//   };

//   const handleDelete = async () => {
//     try {
//       await axios.delete(`http://localhost:5000/api/teams/${deleteTeamId}`, {
//         headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//       });
//       setTeams((prev) => prev.filter((team) => team._id !== deleteTeamId));
//       setFilteredTeams((prev) => prev.filter((team) => team._id !== deleteTeamId));
//       setModalOpen(false);
//       alert("Team deleted successfully!");
//     } catch (err) {
//       alert("Failed to delete team.");
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-blue-100">
//       <Navbar />

//       <div className="flex-1 p-6 max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
//           <h1 className="text-4xl font-extrabold text-blue-700">Our Teams</h1>
//           <div className="flex gap-3 flex-col sm:flex-row w-full sm:w-auto">
//             <input
//               type="text"
//               placeholder="Search teams or leaders..."
//               className="px-4 py-2 rounded-full shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1 sm:w-64"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//             />
//             {userRole === "admin" && (
//               <button
//                 onClick={() => navigate("/add-team")}
//                 className="bg-blue-600 text-white px-5 py-2 rounded-full shadow-lg hover:bg-blue-700 transition flex items-center gap-2"
//               >
//                 + Add Team
//               </button>
//             )}
//           </div>
//         </div>

//         {/* Loading / Error */}
//         {loading ? (
//           <div className="flex justify-center items-center py-20">
//             <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
//           </div>
//         ) : error ? (
//           <p className="text-red-500 text-center text-lg">{error}</p>
//         ) : filteredTeams.length === 0 ? (
//           <p className="text-gray-600 text-center text-lg mt-10">No teams found.</p>
//         ) : (
//           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
//             {filteredTeams.map((team, index) => (
//               <div
//                 key={team._id}
//                 className="relative bg-white rounded-3xl shadow-md p-6 flex flex-col items-center text-center border border-blue-200 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-fadeIn"
//                 style={{ animationDelay: `${index * 100}ms` }}
//               >
//                 {/* Dropdown */}
//                 {userRole === "admin" && (
//                   <div className="absolute top-4 right-4">
//                     <button
//                       className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition"
//                       onClick={() =>
//                         setDropdownOpen(dropdownOpen === team._id ? null : team._id)
//                       }
//                     >
//                       <FiMoreVertical />
//                     </button>
//                     <div
//                       className={`absolute right-0 mt-2 w-32 bg-white border border-gray-300 rounded-md shadow-lg z-10 overflow-hidden transition-all duration-300 ${
//                         dropdownOpen === team._id
//                           ? "opacity-100 scale-100"
//                           : "opacity-0 scale-95 pointer-events-none"
//                       }`}
//                     >
//                       <button
//                         className="block w-full text-left px-4 py-2 hover:bg-blue-100"
//                         onClick={() => navigate(`/edit-team/${team._id}`)}
//                       >
//                         Edit
//                       </button>
//                       <button
//                         className="block w-full text-left px-4 py-2 hover:bg-red-100 text-red-600"
//                         onClick={() => confirmDelete(team._id)}
//                       >
//                         Delete
//                       </button>
//                     </div>
//                   </div>
//                 )}

//                 {/* Team Icon */}
//                 <div className="w-28 h-28 rounded-full overflow-hidden mb-4 border-4 border-blue-200 shadow-sm bg-blue-400 flex items-center justify-center"> 
//                   <FiUsers className="text-white text-4xl" />
//                 </div>

//                 <h2 className="text-2xl font-semibold text-blue-700">{team.team_name || "Unnamed Team"}</h2>
                
//                 {/* Team Leader Badge */}
//                 <div className="mt-2">
//                   {team.team_leader ? (
//                     <span className={`text-white px-3 py-1 rounded-full ${
//                       roleColors[team.team_leader.role?.toUpperCase()] || roleColors.DEFAULT
//                     }`}>
//                       LEADER: {team.team_leader.role?.toUpperCase()}
//                     </span>
//                   ) : (
//                     <span className="text-gray-500 px-3 py-1 rounded-full bg-gray-200">
//                       NO LEADER
//                     </span>
//                   )}
//                 </div>

//                 <p className="text-gray-500 text-sm mt-2">
//                   {team.team_leader ? team.team_leader.name : "No leader assigned"}
//                 </p>
//                 <p className="text-gray-500 text-sm">
//                   Members: {team.members?.length || 0}
//                 </p>

//                 {/* Members List */}
//                 <div className="flex flex-col items-center mt-3 gap-1 max-h-24 overflow-y-auto w-full">
//                   {team.members && team.members.length > 0 ? (
//                     team.members.slice(0, 3).map((m) => (
//                       <div key={m._id} className="text-gray-600 text-sm">
//                         {m.employee ? m.employee.name : "Unknown"}
//                       </div>
//                     ))
//                   ) : (
//                     <div className="text-gray-500 text-sm italic">No members</div>
//                   )}
//                   {team.members && team.members.length > 3 && (
//                     <div className="text-blue-600 text-sm font-medium">
//                       +{team.members.length - 3} more
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Delete Confirmation */}
//       {modalOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
//           <div className="bg-white rounded-xl shadow-lg p-6 w-96 text-center">
//             <h2 className="text-xl font-semibold text-red-600 mb-4">Confirm Delete</h2>
//             <p className="mb-6">Are you sure you want to delete this team?</p>
//             <div className="flex justify-center gap-4">
//               <button
//                 className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
//                 onClick={() => setModalOpen(false)}
//               >
//                 Cancel
//               </button>
//               <button
//                 className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
//                 onClick={handleDelete}
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <Footer />
//     </div>
//   );
// };

// export default Team;