const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');

dotenv.config();

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Generic Cloudinary Storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'voyage_pro', // High-level folder name in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'svg'], // Restrict file types
    // transformation: [{ width: 1000, height: 1000, crop: 'limit' }] // Optional: compress/resize immediately
  },
});

module.exports = {
  cloudinary,
  storage
};
