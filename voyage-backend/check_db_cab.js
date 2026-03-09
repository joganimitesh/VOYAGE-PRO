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

        const requests = await Request.find().sort({ createdAt: -1 }).limit(5);

        console.log("--- Recent 5 Bookings ---");
        requests.forEach(r => {
            console.log(`ID: ${r._id}`);
            console.log(`User: ${r.clientName}`);
            console.log(`TransactionID: ${r.transactionId}`);
            console.log(`Amount: ${r.totalAmount}`);
            console.log(`CabBooking: ${r.cabBooking}`); // Should be true/false
            console.log(`CabPrice: ${r.cabBookingPrice}`);
            console.log(`Date: ${r.createdAt}`);
            console.log("-------------------------");
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkBookings();
