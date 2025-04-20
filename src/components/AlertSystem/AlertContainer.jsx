import { useAlert } from '../../context/AlertContext';
import './AlertSystem.css';

const AlertContainer = () => {
  const { alerts, removeAlert } = useAlert();

  // Get icon based on alert type
  const getAlertIcon = (type) => {
    switch (type) {
      case 'success':
        return 'fa-check-circle';
      case 'error':
        return 'fa-exclamation-circle';
      case 'warning':
        return 'fa-exclamation-triangle';
      case 'info':
      default:
        return 'fa-info-circle';
    }
  };

  return (
    <div className="alert-container">
      {alerts.map((alert) => (
        <div 
          key={alert.id} 
          className={`alert-box ${alert.type}`}
          data-testid="alert"
        >
          <div className="alert-icon">
            <i className={`fas ${getAlertIcon(alert.type)}`}></i>
          </div>
          <div className="alert-content">
            <div className="alert-title">{alert.title}</div>
            <div className="alert-message">{alert.message}</div>
          </div>
          <button 
            className="alert-close"
            onClick={() => removeAlert(alert.id)}
            aria-label="Close"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      ))}
    </div>
  );
};

export default AlertContainer; 