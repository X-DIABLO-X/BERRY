import { useState, useEffect } from 'react';
import Login from './components/Login/Login';
import Desktop from './components/Desktop/Desktop';
import AlertContainer from './components/AlertSystem/AlertContainer';
import { FileSystemProvider } from './context/FileSystemContext';
import { AlertProvider } from './context/AlertContext';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [wallpaper, setWallpaper] = useState('cyberpunk');
  const defaultPassword = 'DIABLO';
  const [password, setPassword] = useState(defaultPassword);
  const [username, setUsername] = useState('User');

  // Available wallpapers
  const wallpapers = {
    cyberpunk: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80',
    matrix: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80',
    neon: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80',
    space: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80'
  };

  // Handle login attempt
  const handleLogin = (enteredPassword) => {
    if (enteredPassword === password) {
      setIsLoggedIn(true);
    } else {
      return false;
    }
    return true;
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  // Handle wallpaper change
  const changeWallpaper = (newWallpaper) => {
    if (wallpapers[newWallpaper]) {
      setWallpaper(newWallpaper);
    }
  };

  // Handle user settings update
  const updateUserSettings = (newUsername, currentPassword, newPassword) => {
    if (currentPassword === password) {
      if (newUsername) {
        setUsername(newUsername);
      }
      if (newPassword) {
        setPassword(newPassword);
      }
      return true;
    }
    return false;
  };

  // Current wallpaper URL
  const currentWallpaper = wallpapers[wallpaper];

  return (
    <AlertProvider>
      <FileSystemProvider>
        <div className="app">
          {!isLoggedIn ? (
            <Login 
              onLogin={handleLogin} 
              wallpaper={currentWallpaper} 
            />
          ) : (
            <Desktop 
              wallpaper={currentWallpaper}
              onLogout={handleLogout}
              onChangeWallpaper={changeWallpaper}
              wallpaperOptions={wallpapers}
              currentWallpaper={wallpaper}
              username={username}
              onUpdateUserSettings={updateUserSettings}
            />
          )}
          <AlertContainer />
        </div>
      </FileSystemProvider>
    </AlertProvider>
  );
}

export default App;
