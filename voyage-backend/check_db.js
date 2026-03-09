const mongoose = require("mongoose");
const Request = require("./models/Request");
const Client = require("./models/Client");
const Package = require("./models/Package");
require("dotenv").config();

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/voyage-db");
        console.log("Connected to DB");

        const requestCount = await Request.countDocuments();
        const approvedRequestCount = await Request.countDocuments({ status: "Approved" });
        const completedRequestCount = await Request.countDocuments({ status: "Completed" });
        const clientCount = await Client.countDocuments();
        const packageCount = await Package.countDocuments();

        console.log("--- DB COUNTS ---");
        console.log(`Total Requests: ${requestCount}`);
        console.log(`Approved Requests: ${approvedRequestCount}`);
        console.log(`Completed Requests: ${completedRequestCount}`);
        console.log(`Clients: ${clientCount}`);
        console.log(`Packages: ${packageCount}`);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDB();
