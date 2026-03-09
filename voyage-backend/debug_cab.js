require("dotenv").config();
const mongoose = require("mongoose");
const Request = require("./models/Request");
const fs = require('fs');
const path = require('path');

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/voyage_db";

mongoose.connect(mongoURI)
    .then(async () => {
        const targetTransactionId = "VOYAGE-1766741876582";
        const booking = await Request.findOne({ transactionId: targetTransactionId });

        let output = "";
        if (booking) {
            output += `Target Booking FOUND: ${booking._id}\n`;
            const clientId = booking.clientId;
            const packageId = booking.packageId;

            output += `Searching for conflicts for Client ${clientId} Package ${packageId}...\n`;

            const allBookings = await Request.find({
                clientId: clientId,
                packageId: packageId,
                status: { $nin: ["Cancelled", "Rejected"] }
            });

            output += `Found ${allBookings.length} bookings.\n`;

            allBookings.forEach((b, i) => {
                output += `[${i}] ID: ${b._id} | Date: ${b.date} | Guests: ${b.guests} | Cab: ${b.cabBooking} | Tx: ${b.transactionId}\n`;
            });
        } else {
            output += `Target Booking (by TxID) NOT FOUND\n`;
        }

        fs.writeFileSync(path.join(__dirname, 'debug_output.txt'), output);
        console.log("Done writing to file.");
        mongoose.disconnect();
    })
    .catch(err => {
        console.error(err);
        mongoose.disconnect();
    });
