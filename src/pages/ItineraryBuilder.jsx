
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import apiClient from '../api/apiClient';
import { toast } from 'react-hot-toast';

const ItineraryBuilder = () => {
    // Column 1: Available Add-ons
    const [availableItems, setAvailableItems] = useState([]);

    // Column 2: Your Trip (Days/Slots)
    const [tripPlan, setTripPlan] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAddOns();
    }, []);

    const fetchAddOns = async () => {
        try {
            // In a real app, query ?category=AddOn or similar. 
            // For now, grabbing all and filtering client-side or grabbing first 10
            const res = await apiClient.get('/packages');
            // Simulating "Short / Add-on" packages by duration < 5 days or specific logic
            const addOns = res.data.filter(p => parseInt(p.duration) <= 5);
            setAvailableItems(addOns);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const onDragEnd = (result) => {
        const { source, destination } = result;

        // Dropped outside
        if (!destination) return;

        // Dropped in same place
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        // Moving from Available -> Trip
        if (source.droppableId === 'available' && destination.droppableId === 'trip') {
            const item = availableItems[source.index];
            // Copy item to trip (don't remove from available so they can reuse potentially, or remove if unique)
            // Let's copy it with a new unique ID
            const newItem = { ...item, uniqueId: `${item._id}-${Date.now()}` };

            const newPlan = Array.from(tripPlan);
            newPlan.splice(destination.index, 0, newItem);
            setTripPlan(newPlan);
        }

        // Reordering Trip
        if (source.droppableId === 'trip' && destination.droppableId === 'trip') {
            const newPlan = Array.from(tripPlan);
            const [reorderedItem] = newPlan.splice(source.index, 1);
            newPlan.splice(destination.index, 0, reorderedItem);
            setTripPlan(newPlan);
        }

        // Removing from Trip (Trash bin concept or just dragging back? For now, dragging back not supported in this simple logic unless we add explicit delete)
    };

    const handleRemove = (index) => {
        const newPlan = Array.from(tripPlan);
        newPlan.splice(index, 1);
        setTripPlan(newPlan);
    };

    const handleSaveItinerary = async () => {
        if (tripPlan.length === 0) return toast.error("Your itinerary is empty!");

        try {
            // Logic to create a "Custom Request" or multiple bookings
            // For now, simple console log / toast
            console.log("Saving Plan:", tripPlan);
            toast.success("Itinerary saved! (Simulated)");
            // In real implementation: POST /api/requests/builder with { packageIds: ... }
        } catch (error) {
            toast.error("Failed to save.");
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Builder...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-secondary">Trip Planner 🛠️</h1>
            <p className="mb-6 text-gray-600">Drag items from the left to build your perfect custom itinerary.</p>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* LEFT: Source */}
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h2 className="text-xl font-semibold mb-4">Available Experiences</h2>
                        <Droppable droppableId="available" isDropDisabled={true}>
                            {/* isDropDisabled=true on source prevents dragging items BACK into the list (if we copied them), 
                 but we need to enable dragging FROM it. Droppable is the container. 
                 Actually, to drag FROM it, we make it a Droppable. 
                 If we want to prevent dropping INTO it, 'isDropDisabled={true}' works for the destination check. 
                 But wait, we want to drag FROM 'available'. 
                 Wait, if isDropDisabled is true, you can't drop ONTO it. That's what we want.
             */}
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="space-y-3 min-h-[300px]"
                                >
                                    {availableItems.map((item, index) => (
                                        <Draggable key={item._id} draggableId={item._id} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 cursor-grab flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <img src={`http://localhost:5001/${item.image}`} alt="" className="w-12 h-12 object-cover rounded-md" />
                                                        <div>
                                                            <h4 className="font-bold text-sm">{item.name}</h4>
                                                            <p className="text-xs text-secondary">{item.duration}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-2xl">+</span>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>

                    {/* RIGHT: Dest */}
                    <div className="bg-primary/5 p-6 rounded-xl border-2 border-dashed border-primary">
                        <h2 className="text-xl font-semibold mb-4 text-primary">Your Itinerary</h2>
                        <Droppable droppableId="trip">
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="space-y-3 min-h-[300px]"
                                >
                                    {tripPlan.length === 0 && <p className="text-gray-400 text-center italic mt-10">Drag items here...</p>}

                                    {tripPlan.map((item, index) => (
                                        <Draggable key={item.uniqueId} draggableId={item.uniqueId} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className="p-4 bg-white shadow-sm border border-primary/20 rounded-lg flex justify-between items-center"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="bg-primary text-white w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">
                                                            {index + 1}
                                                        </span>
                                                        <div>
                                                            <h4 className="font-bold text-gray-800">{item.name}</h4>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleRemove(index)} className="text-red-500 text-xs hover:underline">Remove</button>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>

                        {tripPlan.length > 0 && (
                            <div className="mt-8 pt-4 border-t border-gray-200">
                                <button onClick={handleSaveItinerary} className="w-full py-3 bg-secondary text-white font-bold rounded-lg hover:bg-secondary/90 transition">
                                    Save Trip Plan
                                </button>
                            </div>
                        )}

                    </div>

                </div>
            </DragDropContext>
        </div>
    );
};

export default ItineraryBuilder;
