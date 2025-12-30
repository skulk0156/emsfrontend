import React, { useEffect, useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Toast from "../components/Toast";

const AddProject = () => {
  const [teams, setTeams] = useState([]);
  const [managers, setManagers] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [teamId, setTeamId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [status, setStatus] = useState("In Progress");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const [tRes, mRes] = await Promise.all([API.get("/teams"), API.get("/users/managers")]);
        setTeams(tRes.data || []);
        setManagers(mRes.data || []);
      } catch (err) {
        console.error("Error fetching teams/managers:", err);
        setError("Failed to load teams/managers.");
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!projectName.trim()) {
      setError("Project name is required");
      return;
    }
    if (!managerId) {
      setError("Please select a manager");
      return;
    }

    setLoading(true);
    try {
      // Convert date to ISO format if it exists
      const processedDeadline = deadline ? new Date(deadline).toISOString() : null;
      
      await API.post("/projects", {
        project_name: projectName,
        description,
        team_id: teamId,
        manager_id: managerId,
        status,
        deadline: processedDeadline, // Send as deadline instead of end_date
      });

      setLoading(false);
      setToast({ show: true, message: 'Project created successfully!', type: 'success' });
      setTimeout(() => navigate("/projects"), 2000);
    } catch (err) {
      console.error(err);
      setError("Failed to create project.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col">
      <Navbar />
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6">Add Project</h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <form className="bg-white p-6 rounded-xl shadow space-y-4" onSubmit={handleSubmit}>
            {/* Project name first */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
              <input
                type="text"
                placeholder="Project Name"
                className="w-full p-2 border rounded"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
            </div>

            {/* Description next */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                placeholder="Description"
                className="w-full p-2 border rounded"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* The rest of fields — full width so they stack neatly */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
              <select className="w-full p-2 border rounded" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                <option value="">Select Team</option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.team_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
              <select
                className="w-full p-2 border rounded"
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                required
              >
                <option value="">Select Manager</option>
                {managers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="w-full p-2 border rounded" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input 
                type="date" 
                className="w-full p-2 border rounded" 
                value={deadline} 
                onChange={(e) => setDeadline(e.target.value)} 
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => navigate("/projects")} className="px-4 py-2 rounded border">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white" disabled={loading}>
                {loading ? "Creating..." : "Create Project"}
              </button>
            </div>
          </form>

          {/* Live Preview */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="text-xl font-semibold mb-3">Project Preview</h3>
            <div className="border rounded p-4">
              <h4 className="text-lg font-bold">{projectName || "Project Name"}</h4>
              <p className="text-gray-600 mt-2">{description || "Description will appear here."}</p>

              <div className="mt-4">
                <div className="text-sm text-gray-500">Team</div>
                <div className="font-medium">{teams.find((t) => t._id === teamId)?.team_name || "No team selected"}</div>
              </div>

              <div className="mt-3">
                <div className="text-sm text-gray-500">Manager</div>
                <div className="font-medium">{managers.find((m) => m._id === managerId)?.name || "No manager selected"}</div>
              </div>

              <div className="mt-3 flex gap-4">
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="font-medium">{status}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Deadline</div>
                  <div className="font-medium">{deadline ? new Date(deadline).toLocaleDateString() : "Not set"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
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

export default AddProject;




















// import React, { useEffect, useState } from "react";
// import API from "../api/axios";
// import { useNavigate } from "react-router-dom";
// import Navbar from "../components/Navbar";
// import Footer from "../components/Footer";
// import Toast from "../components/Toast";

// const AddProject = () => {
//   const [teams, setTeams] = useState([]);
//   const [managers, setManagers] = useState([]);
//   const [projectName, setProjectName] = useState("");
//   const [description, setDescription] = useState("");
//   const [teamId, setTeamId] = useState("");
//   const [managerId, setManagerId] = useState("");
//   const [status, setStatus] = useState("In Progress");
//   const [deadline, setDeadline] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
//   const navigate = useNavigate();

//   useEffect(() => {
//     (async () => {
//       try {
//         const [tRes, mRes] = await Promise.all([API.get("/teams"), API.get("/users/managers")]);
//         setTeams(tRes.data || []);
//         setManagers(mRes.data || []);
//       } catch (err) {
//         console.error("Error fetching teams/managers:", err);
//         setError("Failed to load teams/managers.");
//       }
//     })();
//   }, []);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     if (!projectName.trim()) {
//       setError("Project name is required");
//       return;
//     }
//     if (!managerId) {
//       setError("Please select a manager");
//       return;
//     }

//     setLoading(true);
//     try {
//       await API.post("/projects", {
//         project_name: projectName,
//         description,
//         team_id: teamId,
//         manager_id: managerId,
//         status,
//         end_date: deadline, // Map deadline to end_date for backend
//       });

//       setLoading(false);
//       setToast({ show: true, message: 'Project created successfully!', type: 'success' });
//       setTimeout(() => navigate("/projects"), 2000);
//     } catch (err) {
//       console.error(err);
//       setError("Failed to create project.");
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col">
//       <Navbar />
//       <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
//       <h1 className="text-3xl font-bold mb-6">Add Project</h1>
//       {error && <p className="text-red-600 mb-4">{error}</p>}

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Form */}
//         <form className="bg-white p-6 rounded-xl shadow space-y-4" onSubmit={handleSubmit}>
//           {/* Project name first */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
//             <input
//               type="text"
//               placeholder="Project Name"
//               className="w-full p-2 border rounded"
//               value={projectName}
//               onChange={(e) => setProjectName(e.target.value)}
//               required
//             />
//           </div>

//           {/* Description next */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
//             <textarea
//               placeholder="Description"
//               className="w-full p-2 border rounded"
//               value={description}
//               onChange={(e) => setDescription(e.target.value)}
//             />
//           </div>

//           {/* The rest of fields — full width so they stack neatly */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
//             <select className="w-full p-2 border rounded" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
//               <option value="">Select Team</option>
//               {teams.map((team) => (
//                 <option key={team._id} value={team._id}>
//                   {team.team_name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
//             <select
//               className="w-full p-2 border rounded"
//               value={managerId}
//               onChange={(e) => setManagerId(e.target.value)}
//               required
//             >
//               <option value="">Select Manager</option>
//               {managers.map((m) => (
//                 <option key={m._id} value={m._id}>
//                   {m.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
//             <select className="w-full p-2 border rounded" value={status} onChange={(e) => setStatus(e.target.value)}>
//               <option value="In Progress">In Progress</option>
//               <option value="Completed">Completed</option>
//               <option value="On Hold">On Hold</option>
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
//             <input type="date" className="w-full p-2 border rounded" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
//           </div>

//           <div className="flex gap-2 justify-end">
//             <button type="button" onClick={() => navigate("/projects")} className="px-4 py-2 rounded border">
//               Cancel
//             </button>
//             <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white" disabled={loading}>
//               {loading ? "Creating..." : "Create Project"}
//             </button>
//           </div>
//         </form>

//         {/* Live Preview */}
//         <div className="bg-white p-6 rounded-xl shadow">
//           <h3 className="text-xl font-semibold mb-3">Project Preview</h3>
//           <div className="border rounded p-4">
//             <h4 className="text-lg font-bold">{projectName || "Project Name"}</h4>
//             <p className="text-gray-600 mt-2">{description || "Description will appear here."}</p>

//             <div className="mt-4">
//               <div className="text-sm text-gray-500">Team</div>
//               <div className="font-medium">{teams.find((t) => t._id === teamId)?.team_name || "No team selected"}</div>
//             </div>

//             <div className="mt-3">
//               <div className="text-sm text-gray-500">Manager</div>
//               <div className="font-medium">{managers.find((m) => m._id === managerId)?.name || "No manager selected"}</div>
//             </div>

//             <div className="mt-3 flex gap-4">
//               <div>
//                 <div className="text-sm text-gray-500">Status</div>
//                 <div className="font-medium">{status}</div>
//               </div>
//               <div>
//                 <div className="text-sm text-gray-500">Deadline</div>
//                 <div className="font-medium">{deadline ? new Date(deadline).toLocaleDateString() : "Not set"}</div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
      
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

// export default AddProject;