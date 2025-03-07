import React, { createContext, useState, useContext, useEffect } from 'react';

const CarContext = createContext();

export const CarProvider = ({ children }) => {
  // Initialize carData from localStorage if available,
  const [carData, setCarData] = useState(() => {
    const storedCarData = localStorage.getItem('carData');
    return storedCarData
      ? JSON.parse(storedCarData)
      : {
          company: 'Default Company',
          model: 'Default Model',
          productionYear: 2020,
          distanceDriven: 100,
          averageSpeed: 50,
          fuelType: 'Petrol',
          carType: 'Sedan',
          mileage: '20 km/l',
        };
  });

  useEffect(() => {
    localStorage.setItem('carData', JSON.stringify(carData));
  }, [carData]);

  const updateCarData = (newData) => {
    const updatedCarData = { ...carData, ...newData };
    setCarData(updatedCarData);
    return updatedCarData;
  };

  return <CarContext.Provider value={{ carData, updateCarData }}>{children}</CarContext.Provider>;
};

export const useCar = () => {
  const context = useContext(CarContext);
  if (!context) throw new Error('useCar must be used within a CarProvider');
  return context;
};
