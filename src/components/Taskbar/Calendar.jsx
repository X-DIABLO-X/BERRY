import React, { useState, useEffect } from 'react';
import './Calendar.css';

const Calendar = ({ currentDate }) => {
  const [displayDate, setDisplayDate] = useState(new Date(currentDate));
  const [calendarDays, setCalendarDays] = useState([]);
  
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate calendar days when display date changes
  useEffect(() => {
    setCalendarDays(generateDays(displayDate));
  }, [displayDate]);

  // Generate days for current month view
  const generateDays = (date) => {
    const days = [];
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of the week for the first day (0-6)
    const firstDayOfWeek = firstDay.getDay();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: '', empty: true });
    }
    
    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const currentDay = new Date(year, month, day);
      const isToday = isDateToday(currentDay);
      
      days.push({
        day: day,
        date: new Date(year, month, day),
        isToday: isToday,
        empty: false
      });
    }
    
    return days;
  };

  // Check if a date is today
  const isDateToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Navigate to previous month
  const prevMonth = () => {
    setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1));
  };

  // Format month and year for display
  const formatMonthYear = () => {
    return `${months[displayDate.getMonth()]} ${displayDate.getFullYear()}`;
  };

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button className="calendar-nav" onClick={prevMonth}>
          <i className="fas fa-chevron-left"></i>
        </button>
        <div className="calendar-title">{formatMonthYear()}</div>
        <button className="calendar-nav" onClick={nextMonth}>
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
      
      <div className="calendar-weekdays">
        {weekdays.map(day => (
          <div className="weekday" key={day}>{day}</div>
        ))}
      </div>
      
      <div className="calendar-days">
        {calendarDays.map((dayObj, index) => (
          <div 
            key={index} 
            className={`calendar-day ${dayObj.empty ? 'empty' : ''} ${dayObj.isToday ? 'today' : ''}`}
          >
            {dayObj.day}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar; 