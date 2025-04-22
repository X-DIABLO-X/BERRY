import React, { useState, useEffect } from 'react';
import './SplashScreen.css';
import Logo from '../../assets/logo.png';

const SplashScreen = () => {
  const [statusIndex, setStatusIndex] = useState(0);
  const [dots, setDots] = useState('.');
  const [logoLoaded, setLogoLoaded] = useState(false);

  const statusMessages = [
    "Initializing system",
    "Loading configuration",
    "Starting services",
    "Preparing workspace",
    "Almost ready"
  ];

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % statusMessages.length);
    }, 500);
    return () => clearInterval(messageInterval);
  }, []);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(prev => (prev === '...') ? '.' : prev + '.');
    }, 500);
    return () => clearInterval(dotInterval);
  }, []);

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className={`splash-logo ${logoLoaded ? 'loaded' : ''}`}>
          <img src={Logo} alt="BerryOS Logo" onLoad={() => setLogoLoaded(true)} />
        </div>

        <div className="splash-progress-container">
          <div className="splash-progress-bar">
            <div className="splash-progress-fill" />
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
