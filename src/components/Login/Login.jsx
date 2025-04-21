import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { FaUser, FaLock, FaArrowRight } from "react-icons/fa";
import Logo from "../../assets/logo.png";
import "./Login.css";

/**
 * macOS-style login component
 * @param {Object} props - Component props
 * @param {Function} props.onLogin - Function to call when login is successful
 */
const Login = () => {
  const { login, register, isRegistered, user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // UI state
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [bgGradient, setBgGradient] = useState(0);
  
  // Background gradients for cycling
  const gradients = [
    "linear-gradient(45deg, #1a2a6c, #b21f1f, #fdbb2d)",
    "linear-gradient(45deg, #0f0c29, #302b63, #24243e)",
    "linear-gradient(45deg, #7f7fd5, #86a8e7, #91eae4)",
    "linear-gradient(45deg, #3e5151, #decba4)",
    "linear-gradient(45deg, #283c86, #45a247)",
    "linear-gradient(45deg, #5614b0, #dbd65c)"
  ];
  
  // Update time and date every minute
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }));
    };
    
    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);
  
  // Cycle through background gradients
  useEffect(() => {
    const interval = setInterval(() => {
      setBgGradient(prev => (prev + 1) % gradients.length);
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!password || (!isRegistered && !username)) {
      setError("Please fill in all fields");
      return;
    }
    
    setLoading(true);
    
    try {
      if (isRegistered) {
        // Try to unlock with password
        const success = login(password);
        if (success) {
          navigate("/desktop");
        } else {
          setError("Incorrect password");
        }
      } else {
        // Create new user
        register(username, password);
        navigate("/desktop");
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-wrapper">
      <div 
        className="login-background" 
        style={{ background: gradients[bgGradient] }}
      ></div>
      <div className="login-overlay"></div>
      
      <div className="login-datetime">
        <div className="login-time">{time}</div>
        <div className="login-date">{date}</div>
      </div>
      
      <div className="login-container">
        <div className="login-card">
          <div className="login-logo-container">
            <div className="login-logo">
              <img src={Logo} alt="BerryOS Logo" />
            </div>
          </div>
          
          <div className="login-content">
            <h1 className="login-title">
              {isRegistered ? "Welcome Back" : "Create Account"}
            </h1>
            
            {isRegistered && user?.username && (
              <div className="login-username">
                <FaUser className="username-icon" />
                <span>{user.username}</span>
              </div>
            )}
            
            <p className="login-subtitle">
              {isRegistered 
                ? "Enter your password to unlock BerryOS" 
                : "Set up your BerryOS account"}
            </p>
            
            {error && <div className="login-error">{error}</div>}
            
            <form className="login-form" onSubmit={handleSubmit}>
              {!isRegistered && (
                <div className="form-group">
                  <div className="input-icon-wrapper">
                    <input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                    />
                    <FaUser className="input-icon" />
                  </div>
                </div>
              )}
              
              <div className="form-group">
                <div className="input-icon-wrapper">
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={isRegistered ? "current-password" : "new-password"}
                  />
                  <FaLock className="input-icon" />
                </div>
              </div>
              
              <button 
                type="submit" 
                className="login-button" 
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-text">
                    {isRegistered ? "Unlocking" : "Creating account"}
                  </span>
                ) : (
                  <>
                    {isRegistered ? "Unlock" : "Create Account"}
                    <FaArrowRight />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      
      <div className="login-footer">
        <div>BerryOS v1.0</div>
        <div>© 2023 BerryOS. All rights reserved.</div>
      </div>
    </div>
  );
};

export default Login; 