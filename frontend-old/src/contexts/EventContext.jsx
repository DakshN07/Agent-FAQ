import React, { createContext, useState, useEffect, useContext } from 'react';

const EventContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const EventProvider = ({ children }) => {
    const [events, setEvents] = useState([]);
    const [activeEvent, setActiveEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchEvents = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const res = await fetch(`${API_URL}/api/events`, { headers });
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
                if (data.length > 0 && !activeEvent) {
                    setActiveEvent(data[0]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch events", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const selectEvent = (eventId) => {
        const event = events.find(e => e._id === eventId);
        if (event) setActiveEvent(event);
    };

    return (
        <EventContext.Provider value={{ events, activeEvent, selectEvent, loading, refreshEvents: fetchEvents }}>
            {children}
        </EventContext.Provider>
    );
};

export const useEvent = () => useContext(EventContext);
