import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import axios from 'axios';
import { CssBaseline, CircularProgress, Box } from '@mui/material';
import { DataProvider } from './context/DataContext';

// Layouts & Pages
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import DetailPage from './pages/DetailPage';
import RecognizePage from './pages/RecognizePage';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import MiniGamePage from './pages/MiniGamePage';
import BlogPage from './pages/BlogPage';
import NotificationPage from './pages/NotificationPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';

const API_URL = (process.env.REACT_APP_API_URL || "http://localhost:8000") + "/api";

// Helper component for protected routes to reduce repetition
const ProtectedRoute = ({ user, title, children }) => {
  return user ? <MainLayout title={title}>{children}</MainLayout> : <Navigate to="/login" />;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Synchronize Firebase user data with MySQL backend
  const syncUserToMySQL = async (firebaseUser) => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      await axios.post(`${API_URL}/users/sync`, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        photoURL: firebaseUser.photoURL || ""
      }, { headers: { 'Authorization': `Bearer ${token}` } });
    } catch (error) {
      console.error("Sync Error:", error);
    }
  };

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && currentUser.emailVerified) {
        await currentUser.reload();
        setUser(currentUser);
        syncUserToMySQL(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <Box sx={{ height: '100vh', bgcolor: '#1F1D2B', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress sx={{ color: '#EA7C69' }} />
      </Box>
    );
  }

  return (
    <DataProvider>
      <BrowserRouter>
        <CssBaseline />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/home" />} />
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/home" />} />

          {/* Protected Routes using Helper Component */}
          <Route path="/home" element={<ProtectedRoute user={user} title="Home"><HomePage /></ProtectedRoute>} />
          <Route path="/dish/:dishName" element={<ProtectedRoute user={user} title="Dish Details"><DetailPage /></ProtectedRoute>} />
          <Route path="/recognize" element={<ProtectedRoute user={user} title="AI Recognition"><RecognizePage /></ProtectedRoute>} />
          <Route path="/minigame" element={<ProtectedRoute user={user} title="Mini Games"><MiniGamePage /></ProtectedRoute>} />
          <Route path="/blog" element={<ProtectedRoute user={user} title="Blog & Forum"><BlogPage /></ProtectedRoute>} />
          <Route path="/forum/:slug" element={<ProtectedRoute user={user} title="Community Forum"><BlogPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute user={user} title="Notifications"><NotificationPage /></ProtectedRoute>} />
          <Route path="/profile/:uid" element={<ProtectedRoute user={user} title="User Profile"><ProfilePage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute user={user} title="Admin Dashboard"><AdminPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;