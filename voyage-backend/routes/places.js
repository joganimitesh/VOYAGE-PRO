const express = require("express");
const router = express.Router();
const Place = require("../models/Place");

// @route   GET /api/places
// @desc    Get all places (for admin or testing)
// @access  Public
router.get("/", async (req, res) => {
    try {
        const places = await Place.find();
        res.json(places);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route   GET /api/places/state/:state
// @desc    Get places by state name
// @access  Public
router.get("/state/:state", async (req, res) => {
    try {
        const stateName = req.params.state;
        // Case-insensitive search using regex
        const places = await Place.find({
            state: { $regex: new RegExp(`^${stateName}$`, "i") },
        });
        res.json(places);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route   POST /api/places
// @desc    Add a new place (Dev/Admin tool)
// @access  Public (should be protected in prod)
router.post("/", async (req, res) => {
    const {
        name,
        state,
        description,
        image,
        coordinates,
        estimatedPrice,
        category,
        visitDuration,
        historicalSignificance,
    } = req.body;

    try {
        const newPlace = new Place({
            name,
            state,
            description,
            image,
            coordinates,
            estimatedPrice,
            category,
            visitDuration,
            historicalSignificance,
        });

        const place = await newPlace.save();
        res.json(place);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route   POST /api/places/seed
// @desc    Seed some initial data for Gujarat
// @access  Public
router.post("/seed", async (req, res) => {
    try {
        const seedData = [
            {
                name: "Statue of Unity",
                state: "Gujarat",
                description:
                    "The world's tallest statue, dedicated to Sardar Vallabhbhai Patel.",
                image:
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Statue_of_Unity.jpg/800px-Statue_of_Unity.jpg",
                coordinates: { lat: 21.838, lng: 73.7191 },
                estimatedPrice: 1500,
            },
            {
                name: "Rann of Kutch",
                state: "Gujarat",
                description:
                    "A large area of salt marshes that span the border between India and Pakistan.",
                image:
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Rann_of_Kutch_1.jpg/800px-Rann_of_Kutch_1.jpg",
                coordinates: { lat: 23.8377, lng: 70.0768 },
                estimatedPrice: 3000,
            },
            {
                name: "Gir National Park",
                state: "Gujarat",
                description:
                    "Forest and wildlife sanctuary, the only home of the Asiatic lion.",
                image:
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Asiatic_Lion_in_Gir.jpg/800px-Asiatic_Lion_in_Gir.jpg",
                coordinates: { lat: 21.1243, lng: 70.8242 },
                estimatedPrice: 2000,
            },
            {
                name: "Somnath Temple",
                state: "Gujarat",
                description:
                    "One of the 12 Jyotirlinga shrines of Shiva, located on the western coast of Gujarat.",
                image:
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Somnath_Temple.jpg/800px-Somnath_Temple.jpg",
                coordinates: { lat: 20.888, lng: 70.401 },
                estimatedPrice: 0,
            },
            {
                name: "Sabarmati Ashram",
                state: "Gujarat",
                description:
                    "One of the many residences of Mahatma Gandhi.",
                image:
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Sabarmati_Ashram.jpg/800px-Sabarmati_Ashram.jpg",
                coordinates: { lat: 23.052, lng: 72.581 },
                estimatedPrice: 500,
            },
        ];

        await Place.insertMany(seedData);
        res.json({ msg: "Seeded Gujarat places" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// @route   POST /api/places/seed/delhi
// @desc    Seed Delhi data
// @access  Public
router.post("/seed/delhi", async (req, res) => {
    try {
        const seedData = [
            {
                name: "Red Fort",
                state: "Delhi",
                description:
                    "The Red Fort is a historic fort in the city of Delhi in India that served as the main residence of the Mughal Emperors.",
                image:
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Red_Fort_India.jpg/800px-Red_Fort_India.jpg",
                coordinates: { lat: 28.6562, lng: 77.241 },
                estimatedPrice: 500,
                category: "UNESCO World Heritage",
                visitDuration: "2-3 Hours",
                historicalSignificance: "Mughal Seat of Power (Shah Jahan)",
            },
            {
                name: "Qutub Minar",
                state: "Delhi",
                description:
                    "The Qutub Minar, also spelled as Qutab Minar or Qutb Minar, is a minaret and 'victory tower' that forms part of the Qutb complex.",
                image:
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Qutb_Minar_2011.jpg/800px-Qutb_Minar_2011.jpg",
                coordinates: { lat: 28.5244, lng: 77.1855 },
                estimatedPrice: 600,
                category: "UNESCO World Heritage",
                visitDuration: "1.5 Hours",
                historicalSignificance: "World's tallest brick minaret",
            },
            {
                name: "India Gate",
                state: "Delhi",
                description:
                    "The India Gate (formerly known as the All India War Memorial) is a war memorial located astride the Rajpath.",
                image:
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/India_Gate_in_New_Delhi_03-2016.jpg/800px-India_Gate_in_New_Delhi_03-2016.jpg",
                coordinates: { lat: 28.6129, lng: 77.2295 },
                estimatedPrice: 0,
                category: "War Memorial",
                visitDuration: "1 Hour",
                historicalSignificance: "World War I memorial",
            },
            {
                name: "Akshardham Temple",
                state: "Delhi",
                description:
                    "Swaminarayan Akshardham is a Hindu temple, and spiritual-cultural campus in Delhi, India.",
                image:
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Akshardham_Temple_Delhi.jpg/800px-Akshardham_Temple_Delhi.jpg",
                coordinates: { lat: 28.6127, lng: 77.2773 },
                estimatedPrice: 0,
                category: "Religious/Modern",
                visitDuration: "3-4 Hours",
                historicalSignificance: "Exemplar of modern stone carving",
            },
            {
                name: "Humayun's Tomb",
                state: "Delhi",
                description:
                    "Humayun's tomb is the tomb of the Mughal Emperor Humayun in Delhi, India.",
                image:
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Humayun%27s_Tomb_-_Sept_2014.jpg/800px-Humayun%27s_Tomb_-_Sept_2014.jpg",
                coordinates: { lat: 28.5933, lng: 77.2507 },
                estimatedPrice: 600,
                category: "UNESCO World Heritage",
                visitDuration: "2 Hours",
                historicalSignificance: "Precursor to Taj Mahal architecture",
            },
        ];

        await Place.insertMany(seedData);
        res.json({ msg: "Seeded Delhi places" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
