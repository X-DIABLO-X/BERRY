import { useState, useEffect } from 'react';
import Login from './Login/Login';
import Desktop from './Desktop/Desktop';
import './App.css';

// Wallpaper URLs collection
const WALLPAPERS = {
  'wallpaper1.jpg': 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80',
  'wallpaper2.jpg': 'https://images.unsplash.com/photo-1552083375-1447ce886485?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80',
  'wallpaper3.jpg': 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80'
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [wallpaperKey, setWallpaperKey] = useState('wallpaper1.jpg');
  const [wallpaper, setWallpaper] = useState(WALLPAPERS['wallpaper1.jpg']);
  
  // Load user from localStorage if exists
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setIsAuthenticated(true);
      setUsername(userData.username);
      
      // Load saved wallpaper if exists
      const savedWallpaper = localStorage.getItem('wallpaper');
      if (savedWallpaper && WALLPAPERS[savedWallpaper]) {
        setWallpaperKey(savedWallpaper);
        setWallpaper(WALLPAPERS[savedWallpaper]);
      }
    }
  }, []);

  const handleLogin = (user) => {
    setIsAuthenticated(true);
    setUsername(user);
    
    // Save user data to localStorage
    localStorage.setItem('user', JSON.stringify({
      username: user
    }));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    // Optional: Clear localStorage on logout
    // localStorage.removeItem('user');
  };

  const changeWallpaper = (newWallpaperKey) => {
    if (WALLPAPERS[newWallpaperKey]) {
      setWallpaperKey(newWallpaperKey);
      setWallpaper(WALLPAPERS[newWallpaperKey]);
      localStorage.setItem('wallpaper', newWallpaperKey);
    }
  };

  return (
    <div className="app">
      {isAuthenticated ? (
        <Desktop 
          username={username} 
          onLogout={handleLogout} 
          wallpaper={wallpaper}
          wallpaperKey={wallpaperKey}
          onWallpaperChange={changeWallpaper}
          wallpapers={WALLPAPERS}
        />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App; 