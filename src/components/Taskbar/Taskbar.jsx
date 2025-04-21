import { useState, useEffect } from 'react';
import DateTime from './DateTime';
import './Taskbar.css';

const Taskbar = ({ 
  openWindows, 
  activeWindow, 
  onWindowClick,
  onLogout,
  onLock,
  username,
  onTogglePowerMenu,
  powerMenuVisible
}) => {
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
  const handleAppClick = (windowId) => {
    onWindowClick(windowId);
  };

  return (
    <div className="taskbar">
      <div className="taskbar-left">
        <button className="app-menu-button">
          <i className="fas fa-berry"></i>
        </button>
        
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
      </div>
      <div className="taskbar-right">
        <DateTime />
        <button 
          className="taskbar-button lock-button"
          onClick={onLock}
          title="Lock screen"
        >
          <i className="fas fa-lock"></i>
        </button>
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
    </div>
  );
};

export default Taskbar; 