import React from 'react';
import './Loading.css';

const Loading = () => {
  return (
    <div className="loading-container">
      <div className="loading-logo">
        <img src="/logo.png" alt="BerryOS Logo" />
      </div>
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
      <div className="loading-text">
        <h1>BerryOS</h1>
        <p>Loading your workspace...</p>
      </div>
    </div>
  );
};

export default Loading; 