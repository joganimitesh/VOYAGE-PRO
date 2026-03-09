// src/components/admin/AdminTeam.jsx

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import apiClient, { BASE_URL } from "../../api/apiClient";
import Button from "../ui/Button";
import TeamMemberFormModal from "./TeamMemberFormModal";
import { cn } from "../../utils/helpers";

// --- Team Member Card ---
const AdminTeamMemberCard = ({ member, onEdit, onDelete }) => (
  <motion.div
    layout
    className="bg-white dark:bg-slate-800 rounded-xl shadow-md flex items-center p-4 gap-4 hover:shadow-lg transition-all"
  >
    <img
      src={
        member.image
          ? `${BASE_URL}/${member.image}`
          : "https://i.pravatar.cc/150"
      }
      alt={member.name || "Team Member"}
      className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 shrink-0"
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = "https://i.pravatar.cc/150";
      }}
    />

    <div className="flex-grow">
      <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
        {member.name}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {member.title || "Team Member"}
      </p>
    </div>

    {/* Actions (Centered in Flex Flow) */}
    <div className="flex gap-2">
      <button
        onClick={() => onEdit(member)}
        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
        title="Edit Member"
      >
        <Edit size={18} />
      </button>
      <button
        onClick={() => onDelete(member._id)}
        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
        title="Delete Member"
      >
        <Trash2 size={18} />
      </button>
    </div>
  </motion.div>
);

// --- AdminTeam Component ---
const AdminTeam = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ Scroll lock when modal open
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (isModalOpen) {
      htmlElement.style.overflow = "hidden";
    } else {
      htmlElement.style.overflow = "";
    }

    return () => {
      htmlElement.style.overflow = "";
    };
  }, [isModalOpen]);

  // Fetch all team members
  const fetchTeam = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/team");
      setTeamMembers(data.data || []);
    } catch (error) {
      console.error("Failed to fetch team", error);
      alert("Failed to fetch team members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleOpenModalForNew = () => {
    setIsModalOpen(true);
    setMemberToEdit(null);
  };

  const handleOpenModalForEdit = (member) => {
    setIsModalOpen(true);
    setMemberToEdit(member);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  // Add or Update member
  const handleSaveMember = async (formData) => {
    const data = new FormData();
    data.append("name", formData.name);
    data.append("title", formData.title);
    if (formData.imageFile) data.append("imageFile", formData.imageFile);
    if (formData._id) data.append("_id", formData._id);

    try {
      if (formData._id) {
        // Update existing member
        const { data: updated } = await apiClient.patch(
          `/team/update/${formData._id}`,
          data
        );
        setTeamMembers((prev) =>
          prev.map((m) => (m._id === updated.data._id ? updated.data : m))
        );
      } else {
        // Add new member
        const { data: added } = await apiClient.post("/team/add", data);
        setTeamMembers((prev) => [...prev, added.data]);
      }
    } catch (error) {
      console.error("Failed to save team member:", error);
      alert("Failed to save team member.");
    }
    handleCloseModal();
  };

  // Delete member
  const handleDeleteMember = async (id) => {
    if (window.confirm("Are you sure you want to remove this team member?")) {
      try {
        await apiClient.delete(`/team/${id}`);
        setTeamMembers((prev) => prev.filter((m) => m._id !== id));
      } catch (error) {
        console.error("Failed to delete team member:", error);
        alert("Failed to delete team member.");
      }
    }
  };

  // Filter by name or title
  const filteredMembers = teamMembers.filter((member) => {
    const nameMatch = (member.name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const titleMatch = (member.title || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return nameMatch || titleMatch;
  });

  return (
    <div className="dark:text-slate-200 min-h-screen p-4 md:p-8 bg-slate-50 dark:bg-slate-900">
      {/* 🔍 Search + Add Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div className="relative w-full md:w-1/3">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by name or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand bg-white dark:bg-slate-800"
          />
        </div>

        <Button
          onClick={handleOpenModalForNew}
          className="mt-4 md:mt-0 w-full md:w-auto bg-brand text-white hover:bg-brand-hover shadow-brand/30"
        >
          <Plus size={20} className="mr-2" />
          Add Team Member
        </Button>
      </div>

      {/* 👥 Team Member Cards */}
      {loading ? (
        <p className="text-center text-slate-500 dark:text-slate-400">
          Loading team...
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => (
              <AdminTeamMemberCard
                key={member._id}
                member={member}
                onEdit={handleOpenModalForEdit}
                onDelete={handleDeleteMember}
              />
            ))
          ) : (
            <p className="text-center text-slate-500 dark:text-slate-400">
              No team members found.
            </p>
          )}
        </div>
      )}

      {/* 🧩 Modal for Add/Edit */}
      {isModalOpen && (
        <TeamMemberFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveMember}
          memberToEdit={memberToEdit}
        />
      )}
    </div>
  );
};

export default AdminTeam;
