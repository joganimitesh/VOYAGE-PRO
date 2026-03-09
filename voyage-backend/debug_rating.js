const jwt = require("jsonwebtoken");

// Config - use dotenv or hardcode for debug
// Using hardcoded secret for now as we know it from auth.js context or can try default
const SECRET = process.env.JWT_SECRET || "secret123";
const BASE_URL = "http://localhost:5001/api";

const start = async () => {
    try {
        console.log("1. Fetching a package...");
        const pkgRes = await fetch(`${BASE_URL}/packages`);
        const pkgData = await pkgRes.json();

        // Handle array or object wrapper
        const packages = Array.isArray(pkgData) ? pkgData : pkgData.data || [];
        const pkg = packages[0];

        if (!pkg) {
            console.log("No packages found.");
            return;
        }
        console.log(`Found package: ${pkg.name} (${pkg._id})`);

        console.log("2. Generating test token...");
        // Mock user
        const token = jwt.sign({ id: "654321654321654321654321", role: "client", name: "Debug User" }, SECRET, { expiresIn: "1h" });

        console.log("3. Submitting rating...");
        const rateRes = await fetch(`${BASE_URL}/packages/${pkg._id}/rate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-auth-token": token
            },
            body: JSON.stringify({ rating: 5, comment: "Debug comment via fetch" })
        });

        const rateData = await rateRes.json();

        if (rateRes.ok) {
            console.log("✅ Success!", rateData);
        } else {
            console.log("❌ Failed status:", rateRes.status);
            console.log("❌ Failed data:", rateData);
        }

    } catch (err) {
        console.log("❌ Script Error:", err.message);
    }
};

start();
