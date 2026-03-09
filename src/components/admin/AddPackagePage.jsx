// src/components/admin/AddPackagePage.jsx

import React, { useState, useEffect } from "react";
import apiClient, { BASE_URL } from "../../api/apiClient";
import { motion } from "framer-motion";
import Button from "../ui/Button";
import { useNavigate, useParams } from "react-router-dom";
import { getImageUrl } from "../../utils/helpers";

// ✅ Category options
const categoryOptions = [
  "Adventure",
  "Family",
  "Luxury",
  "Beach",
  "Cultural",
  "Wildlife",
];

const AddPackagePage = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    duration: "",
    image: null,
    location: "",
    // rating removed - auto-calculated
    isActive: true,
    highlights: "",
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Fetch package data if editing
  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      apiClient
        .get(`/packages/details-admin/${id}`)
        .then((res) => {
          const pkg = res.data;
          setForm({
            name: pkg.name || "",
            category: pkg.category || "",
            description: pkg.description || "",
            price: pkg.price || "",
            duration: pkg.duration || "",
            image: null,
            location: pkg.location || "",
            // rating removed
            isActive: pkg.isActive !== undefined ? pkg.isActive : true,
            highlights: (pkg.highlights || []).join(", "),
          });
          setImagePreview(getImageUrl(pkg.image));
        })
        .catch((err) => {
          console.error("Failed to fetch package", err);
          alert("Could not load package data.");
          navigate("/admin/packages");
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditing, navigate]);

  // ✅ Input validation
  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Package name is required";
    if (!form.category) newErrors.category = "Category is required";
    if (!form.description.trim())
      newErrors.description = "Description is required";
    if (!form.price || form.price <= 0) newErrors.price = "Enter a valid price";
    if (!form.duration) newErrors.duration = "Duration is required";
    if (!isEditing && !form.image) newErrors.image = "Please upload an image";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Handle file change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // ✅ Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      if (key === "image" && !form.image) return;
      formData.append(key, form[key]);
    });

    try {
      if (isEditing) {
        await apiClient.patch(`/packages/${id}`, formData);
        alert("Package updated successfully!");
      } else {
        await apiClient.post("/packages", formData);
        alert("Package added successfully!");
      }
      setTimeout(() => navigate("/admin/packages"), 1000);
    } catch (err) {
      console.error("Package save error:", err);
      alert(err.response?.data?.message || "Failed to save package.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center p-4 md:p-8">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 w-full max-w-2xl border border-slate-200 dark:border-slate-700"
      >
        <h1 className="text-3xl font-bold text-center text-slate-800 dark:text-slate-100 mb-6">
          {isEditing ? "Edit Travel Package" : "Add New Travel Package"}
        </h1>

        {/* --- Package Info --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="dark:text-slate-300">Package Name</label>
            <input
              type="text"
              placeholder="e.g., Majestic Himalayas"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              // ✅ FIX: Added full dark mode classes
              className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* --- Category --- */}
          <div>
            <label className="dark:text-slate-300">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              // ✅ FIX: Added full dark mode classes
              className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400"
            >
              <option value="" disabled>
                Select a category...
              </option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category}</p>
            )}
          </div>
        </div>

        {/* --- Description --- */}
        <div className="mt-4">
          <label className="dark:text-slate-300">Description</label>
          <textarea
            placeholder="Package description..."
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            // ✅ FIX: Added full dark mode classes
            className="w-full border border-slate-300 rounded-md px-3 py-2 h-24 focus:ring-2 focus:ring-brand dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400"
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        {/* --- Highlights --- */}
        <div className="mt-4">
          <label className="dark:text-slate-300">
            Highlights (comma-separated)
          </label>
          <textarea
            placeholder="e.g., Free breakfast, Guided tour, Mountain view"
            value={form.highlights}
            onChange={(e) =>
              setForm({ ...form, highlights: e.target.value })
            }
            // ✅ FIX: Added full dark mode classes
            className="w-full border border-slate-300 rounded-md px-3 py-2 h-20 focus:ring-2 focus:ring-brand dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400"
          />
        </div>

        {/* --- Price & Duration --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="dark:text-slate-300">Price (₹)</label>
            <input
              type="number"
              placeholder="Price in ₹"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              // ✅ FIX: Added full dark mode classes
              className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400"
            />
            {errors.price && (
              <p className="text-red-500 text-sm mt-1">{errors.price}</p>
            )}
          </div>

          <div>
            <label className="dark:text-slate-300">Duration (in days)</label>
            <input
              type="number"
              placeholder="e.g., 7"
              value={form.duration}
              onChange={(e) =>
                setForm({ ...form, duration: e.target.value })
              }
              // ✅ FIX: Added full dark mode classes
              className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400"
            />
            {errors.duration && (
              <p className="text-red-500 text-sm mt-1">{errors.duration}</p>
            )}
          </div>
        </div>

        {/* --- Location & Rating --- */}
        {/* --- Location --- */}
        <div className="mt-4">
          <label className="dark:text-slate-300">Location</label>
          <input
            type="text"
            placeholder="e.g., Manali, India"
            value={form.location}
            onChange={(e) =>
              setForm({ ...form, location: e.target.value })
            }
            className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400"
          />
        </div>

        {/* --- Status Toggle (Edit mode only) --- */}
        {isEditing && (
          <div className="mt-4">
            <label className="dark:text-slate-300">Package Status</label>
            <select
              value={form.isActive}
              onChange={(e) =>
                setForm({ ...form, isActive: e.target.value === "true" })
              }
              // ✅ FIX: Added full dark mode classes
              className="w-full border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400"
            >
              <option value={true}>Active (Visible to users)</option>
              <option value={false}>Inactive (Hidden from users)</option>
            </select>
          </div>
        )}

        {/* --- Image Upload --- */}
        <div className="mt-4">
          <label className="dark:text-slate-300">
            Package Image {isEditing && "(Leave blank to keep existing)"}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            // ✅ FIX: Ensured dark mode classes are present
            className="w-full border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-500 dark:text-slate-400
              file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-0
              file:bg-brand file:hover:bg-brand-hover
              file:text-white file:font-semibold file:cursor-pointer
              dark:bg-slate-700"
          />
          {errors.image && (
            <p className="text-red-500 text-sm mt-1">{errors.image}</p>
          )}
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              className="mt-4 w-40 h-auto rounded-md"
            />
          )}
        </div>

        {/* --- Submit Button --- */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-brand hover:bg-brand-hover text-white font-semibold py-3 rounded-md mt-6"
        >
          {loading
            ? isEditing
              ? "Updating..."
              : "Uploading..."
            : isEditing
              ? "Update Package"
              : "Add Package"}
        </Button>
      </motion.form>
    </div>
  );
};

export default AddPackagePage;
