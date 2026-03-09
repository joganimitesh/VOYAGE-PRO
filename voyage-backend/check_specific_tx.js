const mongoose = require('mongoose');

// Define Schema minimal requirements
const RequestSchema = new mongoose.Schema({
    clientName: String,
    totalAmount: Number,
    cabBooking: Boolean,
    cabBookingPrice: Number,
    transactionId: String,
    status: String,
    createdAt: Date
});

const Request = mongoose.model('Request', RequestSchema);

async function checkBookings() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/voyage');
        console.log("Connected to DB");

        // Check specific transaction from user screenshot
        const r = await Request.findOne({ transactionId: 'VOYAGE-1766640664628' });

        console.log("--- Scheduled Transaction Check ---");
        if (r) {
            console.log(`ID: ${r._id}`);
            console.log(`TransactionID: ${r.transactionId}`);
            console.log(`Amount: ${r.totalAmount}`);
            console.log(`CabBooking: ${r.cabBooking}`);
            console.log(`CabPrice: ${r.cabBookingPrice}`);
        } else {
            console.log("Transaction not found");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkBookings();
