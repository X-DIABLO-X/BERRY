import React, { useState, useRef, useEffect } from 'react';
import { FaPalette, FaUser, FaBell, FaInfoCircle, FaCheck, FaCamera, FaSave, FaKey, FaLock } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Settings.css';

const Settings = () => {
  const { 
    user, 
    updateUsername, 
    updatePassword, 
    updateProfilePhoto, 
    updateWallpaper, 
    updateTheme,
    updateAccentColor,
    updateNotifications
  } = useAuth();
  
  const [activeSection, setActiveSection] = useState('appearance');
  const [selectedTheme, setSelectedTheme] = useState(user.theme || 'dark');
  const [accentColor, setAccentColor] = useState(user.accentColor || '#bd93f9');
  const [newUsername, setNewUsername] = useState(user.username);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notifications, setNotifications] = useState(user.notifications);
  const [message, setMessage] = useState({ text: '', type: '' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Update local state when user data changes
    setNewUsername(user.username);
    setSelectedTheme(user.theme);
    setAccentColor(user.accentColor);
    setNotifications(user.notifications);
  }, [user]);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 3000);
  };

  const handleUsernameChange = () => {
    if (newUsername.trim() && newUsername !== user.username) {
      const success = updateUsername(newUsername);
      if (success) {
        showMessage('Username updated successfully');
      } else {
        showMessage('Failed to update username', 'error');
      }
    }
  };

  const handlePasswordChange = () => {
    // Validate password inputs
    if (!currentPassword) {
      showMessage('Current password is required', 'error');
      return;
    }
    
    if (!newPassword) {
      showMessage('New password is required', 'error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showMessage('New passwords do not match', 'error');
      return;
    }

    // Update password
    const success = updatePassword(currentPassword, newPassword, (error) => {
      showMessage(error, 'error');
    });

    if (success) {
      showMessage('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Limit to image files
    if (!file.type.startsWith('image/')) {
      showMessage('Please select an image file', 'error');
      return;
    }

    // Limit file size to 2MB
    if (file.size > 2 * 1024 * 1024) {
      showMessage('Image size should be less than 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (event) => {
      const photoUrl = event.target.result;
      const success = updateProfilePhoto(photoUrl);
      
      if (success) {
        showMessage('Profile photo updated successfully');
      } else {
        showMessage('Failed to update profile photo', 'error');
      }
    };
    
    reader.readAsDataURL(file);
  };

  const handleWallpaperChange = (wallpaperPath) => {
    const success = updateWallpaper(wallpaperPath);
    
    if (success) {
      showMessage('Wallpaper updated successfully');
    } else {
      showMessage('Failed to update wallpaper', 'error');
    }
  };

  const handleThemeChange = (e) => {
    const theme = e.target.value;
    setSelectedTheme(theme);
    const success = updateTheme(theme);
    
    if (success) {
      showMessage('Theme updated successfully');
    } else {
      showMessage('Failed to update theme', 'error');
    }
  };

  const handleAccentColorChange = (color) => {
    setAccentColor(color);
    const success = updateAccentColor(color);
    
    if (success) {
      showMessage('Accent color updated successfully');
    } else {
      showMessage('Failed to update accent color', 'error');
    }
  };

  const handleNotificationChange = (key) => {
    const updatedNotifications = {
      ...notifications,
      [key]: !notifications[key]
    };
    
    setNotifications(updatedNotifications);
    const success = updateNotifications(updatedNotifications);
    
    if (success) {
      showMessage('Notification settings updated');
    } else {
      showMessage('Failed to update notification settings', 'error');
    }
  };

  // Available accent colors
  const accentColors = [
    { color: '#bd93f9', name: 'Purple' },
    { color: '#50fa7b', name: 'Green' },
    { color: '#ff79c6', name: 'Pink' },
    { color: '#8be9fd', name: 'Cyan' },
    { color: '#f1fa8c', name: 'Yellow' }
  ];

  // Available wallpapers
  const wallpapers = [
    { path: './assets/wallpapers/wallpaper1.jpg', name: 'Mountains' }
  ];

  const renderAppearanceSettings = () => (
    <>
      <div className="settings-header">
        <h2><FaPalette /> Appearance Settings</h2>
        <p>Customize the look and feel of your BerryOS experience</p>
      </div>
      
      <div className="settings-section">
        <h3>Desktop Background</h3>
        <div className="wallpaper-grid">
          {wallpapers.map(item => (
            <div 
              key={item.path}
              className={`wallpaper-card ${user.wallpaper === item.path ? 'active' : ''}`}
              onClick={() => handleWallpaperChange(item.path)}
            >
              <div className="wallpaper-preview">
                <img src={item.path} alt={`${item.name} Wallpaper`} />
              </div>
              <div className="wallpaper-info">
                <span>{item.name}</span>
                {user.wallpaper === item.path && <FaCheck />}
              </div>
            </div>
          ))}
        </div>
        <p style={{ marginTop: '15px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          <i>Note: More wallpaper options will be available in future updates.</i>
        </p>
      </div>
      
      <div className="settings-section">
        <h3>Theme</h3>
        <div className="settings-row">
          <div className="settings-label">Color Theme</div>
          <div className="settings-control">
            <select 
              className="theme-select" 
              value={selectedTheme} 
              onChange={handleThemeChange}
            >
              <option value="dark">Dark (Default)</option>
              <option value="light">Light</option>
              <option value="dracula">Dracula</option>
              <option value="nord">Nord</option>
            </select>
          </div>
        </div>
        
        <div className="settings-row">
          <div className="settings-label">Accent Color</div>
          <div className="settings-control">
            <div className="color-options">
              {accentColors.map(item => (
                <div 
                  key={item.color}
                  className={`color-option ${accentColor === item.color ? 'active' : ''}`}
                  style={{ backgroundColor: item.color }}
                  onClick={() => handleAccentColorChange(item.color)}
                  title={item.name}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderAccountSettings = () => (
    <>
      <div className="settings-header">
        <h2><FaUser /> Account Settings</h2>
        <p>Manage your user profile and security settings</p>
      </div>
      
      <div className="settings-section">
        <h3>User Profile</h3>
        <div className="profile-pic-section">
          <div className="profile-pic">
            {user.profilePhoto ? (
              <img src={user.profilePhoto} alt={user.username} />
            ) : (
              <div className="default-avatar">{user.username.charAt(0).toUpperCase()}</div>
            )}
          </div>
          <button className="settings-button" onClick={handlePhotoUpload}>
            <FaCamera /> Change Photo
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
        
        <div className="settings-row">
          <div className="settings-label">Username</div>
          <div className="settings-control">
            <div className="input-with-button">
              <input 
                type="text" 
                value={newUsername} 
                onChange={(e) => setNewUsername(e.target.value)}
              />
              <button 
                className="settings-button" 
                onClick={handleUsernameChange}
                disabled={!newUsername.trim() || newUsername === user.username}
              >
                <FaSave /> Save
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="settings-section">
        <h3>Security</h3>
        <div className="settings-row">
          <div className="settings-label">Current Password</div>
          <div className="settings-control">
            <input 
              type="password" 
              placeholder="Enter current password" 
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
        </div>
        
        <div className="settings-row">
          <div className="settings-label">New Password</div>
          <div className="settings-control">
            <input 
              type="password" 
              placeholder="Enter new password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
        </div>
        
        <div className="settings-row">
          <div className="settings-label">Confirm Password</div>
          <div className="settings-control">
            <div className="input-with-button">
              <input 
                type="password" 
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button 
                className="settings-button" 
                onClick={handlePasswordChange}
                disabled={!currentPassword || !newPassword || !confirmPassword}
              >
                <FaLock /> Update
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderNotificationSettings = () => (
    <>
      <div className="settings-header">
        <h2><FaBell /> Notification Settings</h2>
        <p>Configure which notifications you want to receive</p>
      </div>
      
      <div className="settings-section">
        <h3>Notification Preferences</h3>
        
        <div className="settings-row">
          <div className="settings-label">System Notifications</div>
          <div className="settings-control">
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={notifications.system}
                onChange={() => handleNotificationChange('system')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
        
        <div className="settings-row">
          <div className="settings-label">Update Notifications</div>
          <div className="settings-control">
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={notifications.updates}
                onChange={() => handleNotificationChange('updates')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
        
        <div className="settings-row">
          <div className="settings-label">Security Alerts</div>
          <div className="settings-control">
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={notifications.security}
                onChange={() => handleNotificationChange('security')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </>
  );

  const renderAboutSection = () => (
    <>
      <div className="settings-header">
        <h2><FaInfoCircle /> About BerryOS</h2>
        <p>Information about your operating system</p>
      </div>
      
      <div className="settings-section">
        <h3>System Information</h3>
        
        <div className="settings-row">
          <div className="settings-label">Version</div>
          <div className="settings-control">BerryOS 1.0.0</div>
        </div>
        
        <div className="settings-row">
          <div className="settings-label">Build</div>
          <div className="settings-control">2023.10.15-beta</div>
        </div>
        
        <div className="settings-row">
          <div className="settings-label">Platform</div>
          <div className="settings-control">Web Environment</div>
        </div>
      </div>
      
      <div className="settings-section">
        <h3>Credits</h3>
        <p>BerryOS was created as a demonstration of modern web technologies.</p>
        <p>© 2023 BerryOS Development Team. All rights reserved.</p>
      </div>
    </>
  );

  return (
    <div className="settings-container">
      {message.text && (
        <div className={`settings-message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <div className="settings-sidebar">
        <div 
          className={`settings-nav-item ${activeSection === 'appearance' ? 'active' : ''}`}
          onClick={() => setActiveSection('appearance')}
        >
          <FaPalette />
          <span>Appearance</span>
        </div>
        <div 
          className={`settings-nav-item ${activeSection === 'account' ? 'active' : ''}`}
          onClick={() => setActiveSection('account')}
        >
          <FaUser />
          <span>Account</span>
        </div>
        <div 
          className={`settings-nav-item ${activeSection === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveSection('notifications')}
        >
          <FaBell />
          <span>Notifications</span>
        </div>
        <div 
          className={`settings-nav-item ${activeSection === 'about' ? 'active' : ''}`}
          onClick={() => setActiveSection('about')}
        >
          <FaInfoCircle />
          <span>About</span>
        </div>
      </div>
      
      <div className="settings-content">
        {activeSection === 'appearance' && renderAppearanceSettings()}
        {activeSection === 'account' && renderAccountSettings()}
        {activeSection === 'notifications' && renderNotificationSettings()}
        {activeSection === 'about' && renderAboutSection()}
      </div>
    </div>
  );
};

export default Settings; 