// src/components/admin/TeamMemberFormModal.jsx

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload } from "lucide-react";
import InputField from "../ui/InputField";
import Button from "../ui/Button";
import { BASE_URL } from "../../api/apiClient";

const TeamMemberFormModal = ({ isOpen, onClose, onSave, memberToEdit }) => {
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    imageFile: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // ✅ Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (memberToEdit) {
        setFormData({
          ...memberToEdit,
          imageFile: null,
        });
        setImagePreview(
          memberToEdit.image
            ? memberToEdit.image.startsWith("http")
              ? memberToEdit.image
              : `${BASE_URL}/${memberToEdit.image}`
            : null
        );
      } else {
        setFormData({ name: "", title: "", imageFile: null });
        setImagePreview(null);
      }
    }

    // ✅ Cleanup to revoke blob URLs
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [memberToEdit, isOpen]);

  // ✅ Handle text input
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ✅ Handle image upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, imageFile: file }));

      // Revoke previous blob URL if exists
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }

      const previewURL = URL.createObjectURL(file);
      setImagePreview(previewURL);
    }
  };

  // ✅ Submit form
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  const isEditing = !!memberToEdit;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg"
          >
            <div className="p-6">
              {/* --- Header --- */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {isEditing ? "Edit Team Member" : "Add New Team Member"}
                </h2>
                <button
                  onClick={onClose}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* --- Form --- */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <InputField
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  label="Full Name"
                  required
                />
                <InputField
                  name="title"
                  value={formData.title || ""}
                  onChange={handleChange}
                  label="Job Title (e.g., Founder & CEO)"
                  required
                />

                {/* --- Image Upload --- */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Photo
                  </label>
                  <div className="mt-1 flex items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center border border-slate-300 dark:border-slate-600 shrink-0">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://i.pravatar.cc/150";
                          }}
                        />
                      ) : (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          No Image
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-light bg-brand/10 rounded-lg hover:bg-brand/20 dark:bg-brand/20 dark:text-brand-light dark:hover:bg-brand/30 transition-colors"
                    >
                      <Upload size={16} /> Upload Image
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      name="imageFile"
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>
                </div>

                {/* --- Buttons --- */}
                <div className="mt-8 flex justify-end gap-4">
                  <Button
                    type="button"
                    onClick={onClose}
                    variant="secondary"
                    className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="px-6 py-2 bg-brand hover:bg-brand-hover text-white font-semibold"
                  >
                    {isEditing ? "Save Changes" : "Add Member"}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TeamMemberFormModal;
