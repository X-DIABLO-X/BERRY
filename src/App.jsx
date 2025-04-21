import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Desktop from './components/Desktop/Desktop';
import Login from './components/Login/Login';
import Loading from './components/Loading/Loading';
import { AuthProvider, useAuth } from './context/AuthContext';
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
  const [wallpaper, setWallpaper] = useState(user.wallpaper || './assets/wallpapers/wallpaper1.jpg');
  const [error, setError] = useState(null);

  // Update wallpaper when user settings change
  useEffect(() => {
    try {
      setWallpaper(user.wallpaper);
    } catch (err) {
      console.error("Error updating wallpaper:", err);
      setError("Failed to load wallpaper");
    }
  }, [user.wallpaper]);

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

  // Show loading screen during initial load
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
