import { createContext, useState, useContext } from 'react';

// Create context
const AlertContext = createContext();

// Create provider component
export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);

  // Add a new alert
  const showAlert = (message, type = 'info', title = '', duration = 5000) => {
    // Generate a unique ID for the alert
    const id = Date.now();
    
    // Default titles based on type
    if (!title) {
      if (type === 'success') title = 'Success';
      if (type === 'error') title = 'Error';
      if (type === 'warning') title = 'Warning';
      if (type === 'info') title = 'Information';
    }
    
    // Create the alert object
    const alert = {
      id,
      message,
      type,
      title,
    };
    
    // Add the alert to the state
    setAlerts(prev => [...prev, alert]);
    
    // Remove the alert after specified duration
    if (duration !== 0) {
      setTimeout(() => {
        removeAlert(id);
      }, duration);
    }
    
    return id;
  };

  // Remove an alert by ID
  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  return (
    <AlertContext.Provider value={{ alerts, showAlert, removeAlert }}>
      {children}
    </AlertContext.Provider>
  );
}

// Custom hook to use Alert context
export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

export default AlertContext; 