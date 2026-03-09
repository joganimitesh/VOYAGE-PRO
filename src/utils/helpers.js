// src/utils/helpers.js

/**
 * A utility function to conditionally join CSS class names together.
 * @param {...(string|boolean|null|undefined)} classes - A list of classes to potentially join.
 * @returns {string} A string of space-separated class names.
 */
export const cn = (...classes) => classes.filter(Boolean).join(" ");

/**
 * Decodes a JSON Web Token (JWT) to extract its payload.
 * This is a simple, client-side decoder and does NOT verify the token's signature.
 * It's safe to use for reading non-sensitive data like username or email from the payload.
 * @param {string} token - The JWT string.
 * @returns {object|null} The decoded payload object, or null if decoding fails.
 */
export const decodeJwt = (token) => {
  if (!token) return null;

  try {
    // The payload is the second part of the token, base64-encoded.
    const base64Url = token.split(".")[1];

    // Replace characters to make it valid base64, then decode.
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to decode JWT:", e);
    return null;
  }
};

import { BASE_URL } from "../api/apiClient";

/**
 * Constructs a full image URL from a path.
 * Handles cases where the path is already a full URL, or is relative with/without 'uploads/' prefix.
 * @param {string} imagePath - The image path from the database.
 * @returns {string} The full URL.
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http") || imagePath.startsWith("data:")) {
    return imagePath;
  }
  // Check if imagePath already has 'uploads/' prefix (normalized)
  const normalizedPath = imagePath.replace(/\\/g, "/");
  if (normalizedPath.startsWith("uploads/")) {
    return `${BASE_URL}/${normalizedPath}`;
  }
  // Otherwise append 'uploads/'
  return `${BASE_URL}/uploads/${normalizedPath}`;
};

// ✅ Generic Silhouette Avatar (Instagram/WhatsApp style)
import defaultAvatar from '../assets/default-avatar.png';
export const DEFAULT_AVATAR = defaultAvatar;

/**
 * Returns the profile image URL or a generated avatar with initials.
 * @param {string} imagePath - The path to the uploaded image.
 * @param {string} name - The user's name for generating initials.
 * @returns {string} The resolved image URL.
 */
export const getAvatarUrl = (imagePath, name) => {
  if (imagePath) {
    // Optimization: If the backend says the image is "default-avatar.png", use our local asset.
    if (imagePath.includes("default-avatar.png")) {
      return DEFAULT_AVATAR;
    }
    return getImageUrl(imagePath);
  }
  // Return consistent Silhouette Avatar
  return DEFAULT_AVATAR;
};
