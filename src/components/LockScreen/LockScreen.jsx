import { useState, useEffect } from 'react';
import './LockScreen.css';

/**
 * LockScreen component - shown when system is locked
 * @param {Object} props - Component props
 * @param {Function} props.onUnlock - Function to call when unlocking the screen
 * @param {string} props.wallpaper - Wallpaper URL to display
 * @param {string} props.username - Current logged in username
 */
function LockScreen({ onUnlock, wallpaper, username = 'User' }) {
  // State for password input and error handling
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }
    
    // Clear previous errors
    setError('');
    
    // Call the onUnlock function with the password
    const unlockSuccess = onUnlock(password);
    
    if (!unlockSuccess) {
      setError('Incorrect password');
    }
    
    // Always reset password field
    setPassword('');
  };

  // Format time: HH:MM
  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Format date: Day, Month Date
  const formatDate = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const day = days[date.getDay()];
    const month = months[date.getMonth()];
    const dateNum = date.getDate();
    
    return `${day}, ${month} ${dateNum}`;
  };

  // Handle screen click to show password input
  const handleScreenClick = () => {
    if (!showPasswordInput) {
      setShowPasswordInput(true);
    }
  };

  return (
    <div 
      className="lockscreen" 
      style={{ backgroundImage: `url(${wallpaper})` }}
      onClick={handleScreenClick}
    >
      <div className="lockscreen-datetime">
        <div className="lockscreen-time">{formatTime(currentTime)}</div>
        <div className="lockscreen-date">{formatDate(currentTime)}</div>
      </div>
      
      {showPasswordInput ? (
        <div className="lockscreen-container">
          <div className="user-avatar">
            <i className="fas fa-user"></i>
          </div>
          
          <div className="user-name">{username}</div>
          
          {error && <div className="lockscreen-error">{error}</div>}
          
          <form className="lockscreen-form" onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="lockscreen-input"
              autoFocus
            />
            
            <button type="submit" className="lockscreen-button">
              <i className="fas fa-arrow-right"></i>
            </button>
          </form>
        </div>
      ) : (
        <div className="lockscreen-hint">
          Click to unlock
        </div>
      )}
      
      <div className="lockscreen-footer">
        <div className="footer-item">
          <i className="fas fa-wifi"></i>
        </div>
        <div className="footer-item">
          <i className="fas fa-battery-three-quarters"></i>
        </div>
      </div>
    </div>
  );
}

export default LockScreen; 