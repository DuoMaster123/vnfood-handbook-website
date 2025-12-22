import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { auth } from '../firebase';

const DataContext = createContext();
const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:8000") + "/api";

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  // monitor auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => setCurrentUser(user));
    return () => unsubscribe();
  }, []);

  // fetch notifications count
  const fetchUnreadCount = async () => {
    if (!currentUser) return;
    try {
      const res = await axios.get(`${API_URL}/notifications/${currentUser.uid}`);
      setUnreadCount(res.data.filter(n => !n.is_read).length);
    } catch (e) { console.error(e); }
  };

  // real-time polling every 10s
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  return (
    <DataContext.Provider value={{ unreadCount, fetchUnreadCount }}>
      {children}
    </DataContext.Provider>
  );
};