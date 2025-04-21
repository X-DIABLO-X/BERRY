import React, { useState, useEffect, useRef } from 'react';
import Calendar from './Calendar';
import './DateTime.css';

const DateTime = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const dateTimeRef = useRef(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle clicks outside the component to close calendar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateTimeRef.current && !dateTimeRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dateTimeRef]);

  // Format time (HH:MM)
  const formatTime = () => {
    const hours = currentTime.getHours().toString().padStart(2, '0');
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Format date (Day, Month Date)
  const formatDate = () => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return currentTime.toLocaleDateString('en-US', options);
  };

  // Toggle calendar visibility
  const toggleCalendar = (e) => {
    setShowCalendar(!showCalendar);
  };

  return (
    <div className="datetime" ref={dateTimeRef}>
      <div className="time-date-display" onClick={toggleCalendar}>
        <div className="time">{formatTime()}</div>
        <div className="date">{formatDate()}</div>
      </div>
      {showCalendar && (
        <div className="calendar-container">
          <Calendar currentDate={currentTime} />
        </div>
      )}
    </div>
  );
};

export default DateTime; 