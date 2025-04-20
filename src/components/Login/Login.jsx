import { useState, useEffect } from 'react';
import './Login.css';

/**
 * macOS-style login component
 * @param {Object} props - Component props
 * @param {Function} props.onLogin - Function to call when login is successful
 */
function Login({ onLogin }) {
  // State for form inputs and error handling
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [wallpaper, setWallpaper] = useState('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80');

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
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }
    
    // Clear any previous errors
    setError('');
    
    // Call the onLogin function with the username
    onLogin(username);
    
    // Reset form fields
    setUsername('');
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

  return (
    <div className="login-screen" style={{ backgroundImage: `url(${wallpaper})` }}>
      <div className="login-datetime">
        <div className="login-time">{formatTime(currentTime)}</div>
        <div className="login-date">{formatDate(currentTime)}</div>
      </div>
      
      <div className="login-container">
        <div className="user-avatar">
          <i className="fas fa-user"></i>
        </div>
        
        <div className="user-name">{username || 'User'}</div>
        
        {error && <div className="login-error">{error}</div>}
        
        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
            autoFocus
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
          />
          
          <button type="submit" className="login-button">
            <i className="fas fa-arrow-right"></i>
          </button>
        </form>
        
        <div className="login-options">
          <div className="login-option">
            <i className="fas fa-power-off"></i>
          </div>
          <div className="login-option">
            <i className="fas fa-redo"></i>
          </div>
        </div>
      </div>
      
      <div className="login-footer">
        <div className="footer-item">BerryOS</div>
        <div className="footer-item">© {new Date().getFullYear()}</div>
      </div>
    </div>
  );
}

export default Login; 