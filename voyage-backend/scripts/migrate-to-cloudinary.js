const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const { cloudinary } = require("../config/cloudinary");

// Load models
const Package = require("../models/Package");
const Client = require("../models/Client");
const Request = require("../models/Request");
const TeamMember = require("../models/TeamMember");

// Load env
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const MONGO_URI = process.env.MONGO_URI;

// Helper to upload and update
async function uploadToCloudinary(filePath, folderName) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folderName,
    });
    return result.secure_url; // Wait, Cloudinary storage returns req.file.path. Let's match:
  } catch (err) {
    console.error(`Error uploading ${filePath}:`, err.message);
    return null;
  }
}

async function runMigration() {
  if (!MONGO_URI) {
    console.error("MONGO_URI is missing in .env");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB.");

  // 1. Packages
  const packages = await Package.find({});
  let packageCount = 0;
  for (const pkg of packages) {
    if (pkg.image && !pkg.image.includes("res.cloudinary.com")) {
      const fullPath = path.resolve(__dirname, "..", pkg.image); // Usually pkg.image is 'uploads/...' or 'uploads\\...'
      if (fs.existsSync(fullPath)) {
        console.log(`Uploading package image: ${pkg.image}`);
        const url = await uploadToCloudinary(fullPath, "voyage_packages");
        if (url) {
          pkg.image = url;
          await pkg.save();
          packageCount++;
        }
      } else {
        console.warn(`File not found: ${fullPath}`);
      }
    }
  }
  console.log(`Updated ${packageCount} packages.`);

  // 2. Clients (Users)
  const users = await Client.find({});
  let userCount = 0;
  for (const user of users) {
    if (user.profileImage && !user.profileImage.includes("res.cloudinary.com")) {
      const fullPath = path.resolve(__dirname, "..", user.profileImage);
      if (fs.existsSync(fullPath)) {
        console.log(`Uploading user profile image: ${user.profileImage}`);
        const url = await uploadToCloudinary(fullPath, "voyage_profiles");
        if (url) {
          user.profileImage = url;
          await user.save();
          userCount++;
        }
      } else {
        console.warn(`File not found: ${fullPath}`);
      }
    }
  }
  console.log(`Updated ${userCount} users.`);

  // 3. Team Members
  const teamMembers = await TeamMember.find({});
  let teamCount = 0;
  for (const team of teamMembers) {
    if (team.image && !team.image.includes("res.cloudinary.com")) {
      const fullPath = path.resolve(__dirname, "..", team.image);
      if (fs.existsSync(fullPath)) {
        console.log(`Uploading team member image: ${team.image}`);
        const url = await uploadToCloudinary(fullPath, "voyage_team");
        if (url) {
          team.image = url;
          await team.save();
          teamCount++;
        }
      } else {
        console.warn(`File not found: ${fullPath}`);
      }
    }
  }
  console.log(`Updated ${teamCount} team members.`);

  // 4. Requests (Bookings) - documentPath and packageImage
  const requests = await Request.find({});
  let requestCount = 0;
  for (const req of requests) {
    let updated = false;

    // Upload document
    if (req.documentPath && !req.documentPath.includes("res.cloudinary.com")) {
      const fullPath = path.resolve(__dirname, "..", req.documentPath);
      if (fs.existsSync(fullPath)) {
        console.log(`Uploading booking document: ${req.documentPath}`);
        const url = await uploadToCloudinary(fullPath, "voyage_documents");
        if (url) {
          req.documentPath = url;
          updated = true;
        }
      }
    }

    // Attempt to fix packageImage if it's localized (usually copied from package)
    if (req.packageImage && !req.packageImage.includes("res.cloudinary.com")) {
      const fullPath = path.resolve(__dirname, "..", req.packageImage);
      if (fs.existsSync(fullPath)) {
        console.log(`Uploading booking package image: ${req.packageImage}`);
        const url = await uploadToCloudinary(fullPath, "voyage_packages");
        if (url) {
          req.packageImage = url;
          updated = true;
        }
      }
    }

    if (updated) {
      await req.save();
      requestCount++;
    }
  }
  console.log(`Updated ${requestCount} booking requests.`);

  console.log("Migration complete!");
  process.exit(0);
}

runMigration().catch(err => {
  console.error(err);
  process.exit(1);
});
