const mongoose = require('mongoose');
const Request = require('./models/Request');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        // Find the most recent booking to check its content
        const latestInfo = await Request.findOne().sort({ createdAt: -1 });
        if (latestInfo) {
            console.log(`ID: ${latestInfo._id}`);
            console.log(`CabBooking: ${latestInfo.cabBooking}`);
        } else {
            console.log("No bookings found");
        }
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
