import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const StationContext = createContext(null);

export const StationProvider = ({ children }) => {
  const { user } = useAuth();
  const [stations, setStations] = useState([]);
  const [activeStationId, setActiveStationId] = useState(() => {
    return localStorage.getItem('petroflow_station_id') || '';
  });
  const [loadingStations, setLoadingStations] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchStations = async () => {
      setLoadingStations(true);
      try {
        const res = await api.get('/stations');
        setStations(res.data || []);

        // If no station currently chosen or activeStationId not in list, default to first or user's
        if (res.data?.length > 0) {
          const current = localStorage.getItem('petroflow_station_id');
          const exists = res.data.some((s) => s.id === current);
          if (!exists) {
            const initialId = user.stationId || res.data[0].id;
            setActiveStationId(initialId);
            localStorage.setItem('petroflow_station_id', initialId);
          }
        }
      } catch (err) {
        console.error('Failed to load stations', err);
      } finally {
        setLoadingStations(false);
      }
    };

    fetchStations();
  }, [user]);

  const selectStation = (id) => {
    setActiveStationId(id);
    localStorage.setItem('petroflow_station_id', id);
  };

  const activeStation = stations.find((s) => s.id === activeStationId) || stations[0] || null;

  return (
    <StationContext.Provider
      value={{
        stations,
        activeStationId,
        activeStation,
        selectStation,
        loadingStations,
      }}
    >
      {children}
    </StationContext.Provider>
  );
};

export const useStation = () => {
  const context = useContext(StationContext);
  if (!context) throw new Error('useStation must be used within a StationProvider');
  return context;
};
