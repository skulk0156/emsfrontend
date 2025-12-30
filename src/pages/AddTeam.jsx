import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiUsers, FiUserCheck, FiPlusCircle } from "react-icons/fi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const AddTeam = () => {
  const [teamName, setTeamName] = useState("");
  const [teamLeader, setTeamLeader] = useState("");
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/users", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setAllUsers(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!teamName || !teamLeader) {
      setError("Team Name and Leader are required!");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        "http://localhost:5000/api/teams",
        {
          team_name: teamName,
          team_leader_id: teamLeader,
          member_ids: members,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setSuccess("Team created successfully!");
      setTimeout(() => navigate("/team"), 1500);
    } catch (err) {
      console.error(err);
      setError("Failed to create team. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-blue-100">
      <Navbar />

      <div className="flex-1 p-6 max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-white to-blue-50 shadow-2xl rounded-3xl p-10 border border-blue-200">
          <h1 className="text-3xl font-extrabold text-blue-700 mb-6 flex items-center gap-2 justify-center">
            <FiPlusCircle /> Add New Team
          </h1>

          {error && (
            <p className="bg-red-100 text-red-600 px-4 py-2 rounded-lg mb-4 animate-fadeIn">
              {error}
            </p>
          )}
          {success && (
            <p className="bg-green-100 text-green-600 px-4 py-2 rounded-lg mb-4 animate-fadeIn">
              {success}
            </p>
          )}

          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            {/* Team Name */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700 flex items-center gap-1">
                <FiUsers /> Team Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-5 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm transition"
              />
            </div>

            {/* Team Leader */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700 flex items-center gap-1">
                <FiUserCheck /> Team Leader <span className="text-red-500">*</span>
              </label>
              <select
                value={teamLeader}
                onChange={(e) => setTeamLeader(e.target.value)}
                className="w-full px-5 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm transition"
              >
                <option value="">Select leader</option>
                {allUsers.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Members */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700 flex items-center gap-1">
                <FiUsers /> Team Members
              </label>
              <select
                multiple
                value={members}
                onChange={(e) =>
                  setMembers(Array.from(e.target.selectedOptions, (opt) => opt.value))
                }
                className="w-full px-5 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm transition"
              >
                {allUsers
                  .filter((user) => user._id !== teamLeader)
                  .map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
              </select>
              <p className="text-gray-400 text-sm mt-1">
                Hold Ctrl (Cmd on Mac) to select multiple members.
              </p>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 transition font-semibold text-lg"
              >
                {submitting ? "Creating..." : "Create Team"}
              </button>
              <button
                type="button"
                onClick={() => navigate('/team')}
                className="flex-1 bg-white text-blue-600 border-2 border-blue-600 px-6 py-3 rounded-full shadow-lg hover:bg-blue-50 transition font-semibold text-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AddTeam;
