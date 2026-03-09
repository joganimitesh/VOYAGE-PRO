import React, { useState, useEffect } from "react";
import { Marker, InfoWindow } from "@react-google-maps/api";
import GoogleMapWrapper from "../GoogleMapWrapper";
import axios from "axios";
import { BASE_URL } from "../api/apiClient";
import { Loader2, MapPin, Plus, Check, ShoppingBag, Search, ChevronDown, Minus, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";

const CustomPackagePage = () => {
    const [selectedState, setSelectedState] = useState("");
    const [places, setPlaces] = useState([]);
    const [selectedPlaces, setSelectedPlaces] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 });
    const [mapZoom, setMapZoom] = useState(5);
    const [hoveredPlace, setHoveredPlace] = useState(null);
    const [selectedMarker, setSelectedMarker] = useState(null);

    // Initial State Data for Dropdown (Simplified)
    const states = [
        "Gujarat",
        "Delhi", // ✅ Added Delhi
        "Rajasthan",
        "Kerala",
        "Goa",
        "Himachal Pradesh",
        // Add more as needed
    ];

    /* ======================================================
       📍 Fetch Places when State Changes
    ====================================================== */
    useEffect(() => {
        if (!selectedState) return;

        const fetchPlaces = async () => {
            setLoading(true);
            try {
                const res = await axios.get(
                    `${BASE_URL}/api/places/state/${selectedState}`
                );
                setPlaces(res.data);

                // Adjust map center if we have places
                if (res.data.length > 0) {
                    setMapCenter(res.data[0].coordinates);
                    setMapZoom(7);
                }
            } catch (err) {
                toast.error("Failed to fetch places.");
            } finally {
                setLoading(false);
            }
        };

        fetchPlaces();
    }, [selectedState]);

    /* ======================================================
       ➕ Handle Adding/Removing Places
    ====================================================== */
    const togglePlaceSelection = (place) => {
        const isSelected = selectedPlaces.find((p) => p._id === place._id);
        if (isSelected) {
            setSelectedPlaces(selectedPlaces.filter((p) => p._id !== place._id));
        } else {
            setSelectedPlaces([...selectedPlaces, place]);
        }
    };

    /* ======================================================
       🔍 Search & Filter Logic
    ====================================================== */
    const [searchQuery, setSearchQuery] = useState("");

    const filteredPlaces = places.filter((place) =>
        place.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalEstimatedPrice = selectedPlaces.reduce(
        (acc, place) => acc + (place.estimatedPrice || 0),
        0
    );

    /* ======================================================
       📅 Handle Booking (Simplified)
    ====================================================== */
    const handleBooking = async () => {
        if (selectedPlaces.length === 0) {
            toast.error("Please select at least one place.");
            return;
        }

        // Logic to open booking modal or redirect would go here
        // For now, let's just show a success message or log it
        toast.success(`Custom Package created with ${selectedPlaces.length} places!`);
        console.log("Booking Custom Package:", selectedPlaces);

        // Ideally, redirect to a checkout/confirmation page
        // navigate('/checkout', { state: { customPackage: selectedPlaces } });
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-white">
            {/* 🟢 Header Bar */}
            <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 p-4 flex items-center justify-between z-10 shrink-0 sticky top-0">
                <div>
                    <h1 className="text-2xl font-serif text-brand font-bold flex items-center gap-2">
                        <span className="bg-gradient-to-r from-brand-light to-brand text-transparent bg-clip-text">
                            Smart Planner
                        </span>
                    </h1>
                    <p className="text-xs md:text-sm text-gray-500">
                        Design your perfect {selectedState ? `trip to ${selectedState}` : "getaway"} in seconds.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-brand transition-colors" />
                        <select
                            className="pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none ring-2 ring-transparent focus:ring-brand/20 focus:border-brand transition-all hover:bg-white hover:border-gray-300 w-48 appearance-none cursor-pointer"
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                        >
                            <option value="">Select Region</option>
                            {states.map((st) => (
                                <option key={st} value={st}>
                                    {st}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    </div>

                    <button
                        onClick={handleBooking}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 ${selectedPlaces.length > 0
                            ? "bg-gradient-to-r from-brand to-brand-hover text-white shadow-brand/30"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                        disabled={selectedPlaces.length === 0}
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Book Trip <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] ml-1">{selectedPlaces.length}</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">

                {/* 🗺️ Map Section */}
                <div className="flex-1 relative bg-gray-100">
                    {/* Map Alert Overlay (Simulated for Demo if API Key is missing/invalid) */}
                    {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
                        <div className="absolute top-4 left-4 right-4 z-[5] bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-full shrink-0"><Check className="w-4 h-4 text-red-600 rotate-45" /></div>
                            <div>
                                <p className="font-bold text-sm">Google Maps API Key Missing</p>
                                <p className="text-xs opacity-90">Please add VITE_GOOGLE_MAPS_API_KEY to your .env file to enable the map.</p>
                            </div>
                        </div>
                    )}

                    <GoogleMapWrapper center={mapCenter} zoom={mapZoom}>
                        {places.map((place) => (
                            <Marker
                                key={place._id}
                                position={place.coordinates}
                                onClick={() => setSelectedMarker(place)}
                                onMouseOver={() => setHoveredPlace(place._id)}
                                onMouseOut={() => setHoveredPlace(null)}
                                animation={window.google?.maps?.Animation?.DROP}
                            />
                        ))}

                        {selectedMarker && (
                            <InfoWindow
                                position={selectedMarker.coordinates}
                                onCloseClick={() => setSelectedMarker(null)}
                            >
                                <div className="max-w-[240px] p-1 font-sans">
                                    <div className="relative h-36 w-full mb-3 rounded-lg overflow-hidden group">
                                        <img
                                            src={selectedMarker.image}
                                            alt={selectedMarker.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                                            <h3 className="font-bold text-white text-sm leading-tight drop-shadow-md">
                                                {selectedMarker.name}
                                            </h3>
                                        </div>
                                    </div>

                                    <p className="text-gray-600 text-xs mb-3 line-clamp-3 leading-relaxed">
                                        {selectedMarker.description}
                                    </p>

                                    <div className="flex items-center justify-between mb-3 bg-gray-50 p-2 rounded-md border border-gray-100">
                                        <span className="text-xs text-gray-500">Est. Price</span>
                                        <span className="font-bold text-brand">₹{selectedMarker.estimatedPrice}</span>
                                    </div>

                                    <button
                                        onClick={() => {
                                            togglePlaceSelection(selectedMarker);
                                            setSelectedMarker(null);
                                        }}
                                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${selectedPlaces.find((p) => p._id === selectedMarker._id)
                                            ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                            : "bg-brand text-white hover:bg-brand-hover shadow-brand/20"
                                            }`}
                                    >
                                        {selectedPlaces.find((p) => p._id === selectedMarker._id)
                                            ? "Remove"
                                            : "Add to Itinerary"}
                                    </button>
                                </div>
                            </InfoWindow>
                        )}
                    </GoogleMapWrapper>
                </div>

                {/* 📋 Modern Sidebar */}
                <div className="w-[400px] bg-white border-l border-gray-200 flex flex-col shadow-2xl shadow-gray-200/50 z-20 transition-all duration-300">

                    {/* Sidebar Header */}
                    <div className="p-5 border-b border-gray-100 bg-white sticky top-0 z-10">
                        <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2 font-serif">
                            {selectedState ? `Explore ${selectedState}` : "Popular Destinations"}
                        </h2>

                        {/* Search Bar */}
                        <div className="mt-4 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search places..."
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                disabled={!selectedState}
                            />
                        </div>
                    </div>

                    {/* Places List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <Loader2 className="w-8 h-8 text-brand animate-spin" />
                                <p className="text-sm text-gray-500">Finding best spots...</p>
                            </div>
                        ) : !selectedState ? (
                            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                                <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-4">
                                    <MapPin className="w-8 h-8 text-brand-light" />
                                </div>
                                <h3 className="text-gray-800 font-bold mb-1">Where to next?</h3>
                                <p className="text-sm text-gray-500">Select a state from the top bar to discover amazing places.</p>
                            </div>
                        ) : filteredPlaces.length === 0 ? (
                            <div className="text-center text-gray-400 py-20">
                                <p>No places found matching "{searchQuery}".</p>
                            </div>
                        ) : (
                            filteredPlaces.map((place) => {
                                const isSelected = selectedPlaces.find(
                                    (p) => p._id === place._id
                                );
                                return (
                                    <div
                                        key={place._id}
                                        className={`group flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden bg-white ${hoveredPlace === place._id
                                            ? "border-brand shadow-md ring-1 ring-brand/20 -translate-y-0.5"
                                            : "border-gray-100 hover:border-brand-light hover:shadow-lg hover:shadow-gray-100"
                                            }`}
                                        onMouseEnter={() => setHoveredPlace(place._id)}
                                        onMouseLeave={() => setHoveredPlace(null)}
                                        onClick={() => {
                                            setMapCenter(place.coordinates);
                                            setMapZoom(12);
                                            setSelectedMarker(place);
                                        }}
                                    >
                                        <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0 group-hover:shadow-md transition-all">
                                            <img
                                                src={place.image}
                                                alt={place.name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-brand/40 flex items-center justify-center backdrop-blur-[1px]">
                                                    <Check className="w-8 h-8 text-white drop-shadow-md" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 flex flex-col h-full justify-between py-0.5">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-bold text-gray-800 text-sm truncate pr-2 group-hover:text-brand transition-colors">
                                                        {place.name}
                                                    </h3>
                                                </div>
                                                <p className="text-gray-500 text-[11px] mt-1 line-clamp-2 leading-relaxed">
                                                    {place.description}
                                                </p>
                                            </div>

                                            <div className="mt-2 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Est. Cost</span>
                                                    <span className="text-sm font-bold text-brand">₹{place.estimatedPrice}</span>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        togglePlaceSelection(place);
                                                    }}
                                                    className={`p-2 rounded-lg transition-all ${isSelected
                                                        ? "bg-red-50 text-red-500 hover:bg-red-100"
                                                        : "bg-gray-50 text-gray-400 hover:bg-brand/10 hover:text-brand"
                                                        }`}
                                                >
                                                    {isSelected ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* 🧾 Trip Summary Footer */}
                    {selectedPlaces.length > 0 && (
                        <div className="bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-500 text-sm font-medium">Estimated Total ({selectedPlaces.length} items)</span>
                                <span className="text-xl font-bold text-brand">₹{totalEstimatedPrice.toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-center text-gray-400 mb-3">
                                *Final price may vary based on dates & customizations
                            </p>
                            <button
                                onClick={handleBooking}
                                className="w-full py-3 bg-brand hover:bg-brand-hover text-white font-bold rounded-xl shadow-lg shadow-brand/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                Proceed to Review <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomPackagePage;
