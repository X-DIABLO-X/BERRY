import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Desktop from './components/Desktop/Desktop';
import Login from './components/Login/Login';
import Loading from './components/Loading/Loading';
import SplashScreen from './components/SplashScreen/SplashScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import Wallpaper1 from './assets/wallpapers/wallpaper1.jpg';
import './App.css';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return children;
};

// Main App container that manages authentication
const AppContent = () => {
  const { isAuthenticated, isRegistered, isLoading, user, logout, lock } = useAuth();
  const [wallpaper, setWallpaper] = useState(user.wallpaper || Wallpaper1);
  const [error, setError] = useState(null);
  const [showSplash, setShowSplash] = useState(() => {
    // Check if this is the first load
    return !localStorage.getItem('berry_splash_shown');
  });

  // Show splash screen for 2.5 seconds, but only on first load
  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        // Set flag in localStorage to remember splash was shown
        localStorage.setItem('berry_splash_shown', 'true');
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  // Update wallpaper when user settings change
  useEffect(() => {
    try {
      setWallpaper(user.wallpaper);
    } catch (err) {
      console.error("Error updating wallpaper:", err);
      setError("Failed to load wallpaper");
    }
  }, [user.wallpaper]);

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen />;
  }

  // Error state
  if (error) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1>Something went wrong</h1>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reload App</button>
      </div>
    );
  }

  // Show loading screen during authentication load
  if (isLoading) {
    return <Loading />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/desktop" element={
        <ProtectedRoute>
          <Desktop 
            username={user.username}
            onLogout={logout}
            onLock={lock}
            wallpaper={wallpaper}
            onWallpaperChange={setWallpaper}
          />
        </ProtectedRoute>
      } />
      <Route path="/" element={<Navigate to={isAuthenticated ? "/desktop" : "/login"} />} />
    </Routes>
  );
};

// Root App component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
