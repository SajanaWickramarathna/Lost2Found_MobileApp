import React, { createContext, useContext, useState } from 'react';

type LocationData = {
  latitude: number;
  longitude: number;
  address: string;
} | null;

interface LocationContextType {
  selectedLocation: LocationData;
  setSelectedLocation: (loc: LocationData) => void;
}

const LocationContext = createContext<LocationContextType>({
  selectedLocation: null,
  setSelectedLocation: () => {},
});

export const useLocationSelection = () => useContext(LocationContext);

export const LocationSelectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedLocation, setSelectedLocation] = useState<LocationData>(null);

  return (
    <LocationContext.Provider value={{ selectedLocation, setSelectedLocation }}>
      {children}
    </LocationContext.Provider>
  );
};
