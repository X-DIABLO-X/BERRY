import { useState, useEffect } from 'react';
import DateTime from './DateTime';
import Weather from '../Weather/Weather';
import './Taskbar.css';

const Taskbar = ({ 
  openWindows, 
  activeWindow, 
  onWindowClick,
  onLogout,
  onLock,
  username,
  onTogglePowerMenu,
  powerMenuVisible,
  onToggleChatbot
}) => {
  // State for weather component
  const [isWeatherOpen, setIsWeatherOpen] = useState(false);
  
  // App buttons config
  const appButtons = [
    { id: 'file-explorer', icon: 'fa-folder', label: 'Files' },
    { id: 'terminal', icon: 'fa-terminal', label: 'Terminal' },
    { id: 'browser', icon: 'fa-globe', label: 'Browser' },
    { id: 'settings', icon: 'fa-cog', label: 'Settings' }
  ];
  
  // Check if window is open and active
  const isWindowOpen = (id) => {
    return openWindows.some(win => win.id === id);
  };
  
  // Handle app button click
  const handleAppClick = (id) => {
    onWindowClick(id);
  };

  // Toggle weather display
  const toggleWeather = () => {
    setIsWeatherOpen(!isWeatherOpen);
  };

  // Get all non-default windows that should be shown in taskbar
  const getActiveWindows = () => {
    // Filter out windows that aren't part of the default app buttons
    return openWindows.filter(win => !appButtons.some(app => app.id === win.id));
  };

  return (
    <div className="taskbar">
      <div className="taskbar-left">
        <button className="app-menu-button" onClick={onToggleChatbot}>
          <i className="fas fa-robot"></i>
        </button>
        
        {/* Default app buttons */}
        {appButtons.map(app => (
          <button 
            key={app.id}
            className={`taskbar-button ${isWindowOpen(app.id) ? 'active' : ''} ${activeWindow === app.id ? 'current' : ''}`}
            onClick={() => handleAppClick(app.id)}
            title={app.label}
          >
            <i className={`fas ${app.icon}`}></i>
            <span>{app.label}</span>
          </button>
        ))}
        
        {/* Custom window buttons */}
        {getActiveWindows().map(win => (
          <button 
            key={win.id}
            className={`taskbar-button ${!win.minimized ? 'active' : 'minimized-window'} ${activeWindow === win.id ? 'current' : ''}`}
            onClick={() => handleAppClick(win.id)}
            title={win.title}
          >
            <i className={`fas fa-${win.icon}`}></i>
            <span>{win.title}</span>
          </button>
        ))}
      </div>
      <div className="taskbar-right">
        <button 
          className="taskbar-button weather-button" 
          onClick={toggleWeather}
          title="Weather"
        >
          <i className="fas fa-cloud-sun"></i>
        </button>
        
        <DateTime />
        
        <button 
          className="taskbar-button user-button"
          onClick={onTogglePowerMenu}
          title="User options"
        >
          <i className="fas fa-user-circle"></i>
          <span>{username}</span>
          <i className={`fas fa-chevron-${powerMenuVisible ? 'up' : 'down'} dropdown-icon`}></i>
        </button>
      </div>
      
      {/* Weather component */}
      <Weather isOpen={isWeatherOpen} onClose={toggleWeather} />
    </div>
  );
};

export default Taskbar; 