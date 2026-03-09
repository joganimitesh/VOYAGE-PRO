import axios from "axios";
import jwt from "jsonwebtoken";

// Config
const SECRET = "secret123"; // verified from auth.js default
const BASE_URL = "http://localhost:5001/api";

const start = async () => {
    try {
        console.log("1. Fetching a package...");
        const pkgRes = await axios.get(`${BASE_URL}/packages`);
        // Assuming backend returns array or { data: [] }
        const packages = Array.isArray(pkgRes.data) ? pkgRes.data : pkgRes.data.data;
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
        // Note: The backend expects x-auth-token header
        const rateRes = await axios.post(
            `${BASE_URL}/packages/${pkg._id}/rate`,
            { rating: 5, comment: "Debug comment" },
            { headers: { "x-auth-token": token } }
        );

        console.log("✅ Success!", rateRes.data);
    } catch (err) {
        if (err.response) {
            console.log("❌ Failed status:", err.response.status);
            console.log("❌ Failed data:", err.response.data);
        } else {
            console.log("❌ Failed:", err.message);
        }
    }
};

start();
