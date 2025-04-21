import React, { useState, useEffect } from 'react';
import './SplashScreen.css';
import Logo from '../../assets/logo.png';

const SplashScreen = () => {
  const [statusIndex, setStatusIndex] = useState(0);
  const [dots, setDots] = useState('.');
  
  const statusMessages = [
    "Initializing system",
    "Loading configuration",
    "Starting services",
    "Preparing workspace",
    "Almost ready"
  ];
  
  // Cycle through status messages
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % statusMessages.length);
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  // Animate loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev === '...' ? '.' : prev + '.');
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="splash-logo">
          <img src={Logo} alt="BerryOS Logo" />
        </div>
        
        <div className="splash-progress-container">
          <div className="splash-progress-bar">
            <div className="splash-progress-fill"></div>
          </div>
        </div>
        
        <div className="splash-text">
          <h1>BerryOS</h1>
          <div className="status-text">
            <span className="status-message">{statusMessages[statusIndex]}</span>
            <span className="loading-dots">{dots}</span>
          </div>
        </div>
        
        <div className="splash-version">Version 1.0</div>
      </div>
    </div>
  );
};

export default SplashScreen; 