import React from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = {
    width: "100%",
    height: "100%",
};

const defaultCenter = {
    lat: 20.5937,
    lng: 78.9629, // Center of India
};

const GoogleMapWrapper = ({ children, center, zoom = 5, onClick }) => {
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    });

    const [map, setMap] = React.useState(null);

    const onLoad = React.useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = React.useCallback(function callback(map) {
        setMap(null);
    }, []);

    if (!isLoaded) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
            </div>
        );
    }

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center || defaultCenter}
            zoom={zoom}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onClick={onClick}
            options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
            }}
        >
            {children}
        </GoogleMap>
    );
};

export default React.memo(GoogleMapWrapper);
