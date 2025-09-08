import React, { createContext, useContext, useState } from "react";

const HealthContext = createContext();

export const HealthProvider = ({ children }) => {
  const [profile, setProfile] = useState({
    age: null,
    gender: null,
    weight: null,
    height: null,
    activity: null,
    conditions: [],
    goals: [],
    allergies: [],
  });

  return (
    <HealthContext.Provider value={{ profile, setProfile }}>
      {children}
    </HealthContext.Provider>
  );
};

export const useHealth = () => useContext(HealthContext);
