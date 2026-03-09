// src/components/MapComponent.jsx
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// ✅ Define Custom Icon (No Prototype Mutation)
const customIcon = L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// ✅ Error Boundary to catch Map crashes (e.g., "Map container is already initialized")
class MapErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Map Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="h-full w-full flex flex-col items-center justify-center bg-red-50 text-red-600 p-4 text-center">
                    <p className="font-semibold">Something went wrong loading the map.</p>
                    <p className="text-xs mt-2 bg-white p-2 rounded border border-red-200">
                        {this.state.error?.message || "Unknown error"}
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}

const MapComponent = ({ lat, lng, zoom = 13 }) => {
    // ✅ Safety Check: Ensure lat/lng are valid numbers
    const latitude = Number(lat);
    const longitude = Number(lng);

    // If coordinates are missing or invalid, showing a map is risky/useless
    if (isNaN(latitude) || isNaN(longitude)) {
        return (
            <div className="h-64 md:h-96 w-full bg-slate-100 dark:bg-slate-700/50 flex flex-col items-center justify-center text-slate-500 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600">
                <p>Location data not available.</p>
            </div>
        );
    }

    const position = [latitude, longitude];

    // ✅ Key ensures map re-renders if position changes (prevents grey screen)
    const key = `${latitude}-${longitude}`;

    return (
        <div className="h-64 md:h-96 w-full rounded-xl overflow-hidden shadow-lg z-0 relative bg-slate-100">
            <MapErrorBoundary>
                <MapContainer
                    key={key}
                    center={position}
                    zoom={zoom}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={position} icon={customIcon}>
                        <Popup>
                            Location: {latitude}, {longitude}
                        </Popup>
                    </Marker>
                </MapContainer>
            </MapErrorBoundary>
        </div>
    );
};

export default MapComponent;
