import React, { createContext, useContext, useState, useEffect } from 'react';

// Create context
export const AuthContext = createContext();

// Settings keys in localStorage
const STORAGE_KEYS = {
  USERNAME: 'berry_username',
  PASSWORD: 'berry_password',
  PROFILE_PHOTO: 'berry_profile_photo',
  WALLPAPER: 'berry_wallpaper',
  THEME: 'berry_theme',
  ACCENT_COLOR: 'berry_accent_color',
  IS_REGISTERED: 'berry_is_registered',
  NOTIFICATIONS: 'berry_notifications'
};

export const AuthProvider = ({ children }) => {
  // Initial state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState({
    username: 'User',
    profilePhoto: null,
    theme: 'dark',
    accentColor: '#bd93f9',
    wallpaper: './assets/wallpapers/wallpaper1.jpg',
    notifications: {
      system: true,
      updates: true,
      security: true
    }
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const loadUserData = () => {
      setIsLoading(true);
      
      // Check if user is registered
      const registeredStatus = localStorage.getItem(STORAGE_KEYS.IS_REGISTERED) === 'true';
      setIsRegistered(registeredStatus);
      
      if (registeredStatus) {
        // Load user data
        const username = localStorage.getItem(STORAGE_KEYS.USERNAME) || 'User';
        const profilePhoto = localStorage.getItem(STORAGE_KEYS.PROFILE_PHOTO) || null;
        const wallpaper = localStorage.getItem(STORAGE_KEYS.WALLPAPER) || './assets/wallpapers/wallpaper1.jpg';
        const theme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
        const accentColor = localStorage.getItem(STORAGE_KEYS.ACCENT_COLOR) || '#bd93f9';
        
        // Parse notifications object
        let notifications = {
          system: true,
          updates: true,
          security: true
        };
        
        try {
          const savedNotifications = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
          if (savedNotifications) {
            notifications = JSON.parse(savedNotifications);
          }
        } catch (error) {
          console.error('Error parsing notifications:', error);
        }
        
        setUser({
          username,
          profilePhoto,
          theme,
          accentColor,
          wallpaper,
          notifications
        });
      }
      
      setIsLoading(false);
    };
    
    loadUserData();
  }, []);

  // Register a new user
  const register = (username, password) => {
    // Save user data
    localStorage.setItem(STORAGE_KEYS.USERNAME, username);
    localStorage.setItem(STORAGE_KEYS.PASSWORD, password); // In a real app, this should be hashed
    localStorage.setItem(STORAGE_KEYS.IS_REGISTERED, 'true');
    
    // Update state
    setUser(prev => ({
      ...prev,
      username
    }));
    setIsRegistered(true);
    setIsAuthenticated(true);
  };

  // Login (now used for unlocking)
  const login = (password) => {
    const storedPassword = localStorage.getItem(STORAGE_KEYS.PASSWORD);
    
    if (password === storedPassword) {
      setIsAuthenticated(true);
      return true;
    } else {
      return false;
    }
  };

  // Logout (now used for locking)
  const logout = () => {
    setIsAuthenticated(false);
  };

  // Lock screen
  const lock = () => {
    setIsAuthenticated(false);
  };

  // Update username
  const updateUsername = (newUsername) => {
    localStorage.setItem(STORAGE_KEYS.USERNAME, newUsername);
    setUser(prev => ({
      ...prev,
      username: newUsername
    }));
    return true;
  };

  // Update password
  const updatePassword = (currentPassword, newPassword, errorCallback) => {
    const storedPassword = localStorage.getItem(STORAGE_KEYS.PASSWORD);
    
    if (currentPassword === storedPassword) {
      localStorage.setItem(STORAGE_KEYS.PASSWORD, newPassword);
      return true;
    } else {
      if (errorCallback) errorCallback('Current password is incorrect');
      return false;
    }
  };

  // Update profile photo
  const updateProfilePhoto = (photoUrl) => {
    localStorage.setItem(STORAGE_KEYS.PROFILE_PHOTO, photoUrl);
    setUser(prev => ({
      ...prev,
      profilePhoto: photoUrl
    }));
    return true;
  };

  // Update wallpaper
  const updateWallpaper = (wallpaperPath) => {
    localStorage.setItem(STORAGE_KEYS.WALLPAPER, wallpaperPath);
    setUser(prev => ({
      ...prev,
      wallpaper: wallpaperPath
    }));
    return true;
  };

  // Update theme
  const updateTheme = (theme) => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    setUser(prev => ({
      ...prev,
      theme
    }));
    
    // Apply theme to body or root element
    document.documentElement.setAttribute('data-theme', theme);
    return true;
  };

  // Update accent color
  const updateAccentColor = (color) => {
    localStorage.setItem(STORAGE_KEYS.ACCENT_COLOR, color);
    setUser(prev => ({
      ...prev,
      accentColor: color
    }));
    
    // Apply accent color as CSS variable
    document.documentElement.style.setProperty('--accent-color', color);
    return true;
  };

  // Update notifications
  const updateNotifications = (notifications) => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    setUser(prev => ({
      ...prev,
      notifications
    }));
    return true;
  };

  const value = {
    isAuthenticated,
    isRegistered,
    isLoading,
    user,
    register,
    login,
    logout,
    lock,
    updateUsername,
    updatePassword,
    updateProfilePhoto,
    updateWallpaper,
    updateTheme,
    updateAccentColor,
    updateNotifications
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 