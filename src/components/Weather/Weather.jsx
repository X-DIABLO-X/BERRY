import React, { useState, useEffect } from 'react';
import './Weather.css';

const Weather = ({ isOpen, onClose }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState({ latitude: 0, longitude: 0 });
  const [locationName, setLocationName] = useState('');

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          // Get location name based on coordinates
          fetchLocationName(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          console.error("Error getting location:", err);
          // Fallback to default location (New York)
          setLocation({ latitude: 40.7128, longitude: -74.0060 });
          setLocationName('New York');
        }
      );
    } else {
      // Fallback to default location (New York)
      setLocation({ latitude: 40.7128, longitude: -74.0060 });
      setLocationName('New York');
    }
  }, []);

  // Fetch location name from coordinates using reverse geocoding
  const fetchLocationName = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/geocoding?latitude=${lat}&longitude=${lon}&format=json`
      );
      if (!response.ok) {
        throw new Error('Geocoding failed');
      }
      const data = await response.json();
      if (data && data.results && data.results.length > 0) {
        const place = data.results[0];
        setLocationName(place.name || 'Unknown location');
      }
    } catch (err) {
      console.error('Error fetching location name:', err);
      setLocationName('Unknown location');
    }
  };

  useEffect(() => {
    // Skip API call if latitude and longitude are default values
    if (location.latitude === 0 && location.longitude === 0) {
      return;
    }

    const fetchWeather = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }

        const data = await response.json();
        setWeather(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError('Failed to load weather data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [location]);

  // Function to get weather icon based on weather code
  const getWeatherIcon = (code) => {
    // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
    if (code === 0) return 'fa-sun'; // Clear sky
    if (code === 1) return 'fa-sun'; // Mainly clear
    if (code === 2) return 'fa-cloud-sun'; // Partly cloudy
    if (code === 3) return 'fa-cloud'; // Overcast
    if (code >= 45 && code <= 48) return 'fa-smog'; // Fog
    if (code >= 51 && code <= 55) return 'fa-cloud-rain'; // Drizzle
    if (code >= 56 && code <= 57) return 'fa-cloud-rain'; // Freezing Drizzle
    if (code >= 61 && code <= 65) return 'fa-cloud-showers-heavy'; // Rain
    if (code >= 66 && code <= 67) return 'fa-cloud-rain'; // Freezing Rain
    if (code >= 71 && code <= 77) return 'fa-snowflake'; // Snow
    if (code >= 80 && code <= 82) return 'fa-cloud-showers-heavy'; // Rain showers
    if (code >= 85 && code <= 86) return 'fa-snowflake'; // Snow showers
    if (code === 95) return 'fa-bolt'; // Thunderstorm
    if (code >= 96 && code <= 99) return 'fa-bolt'; // Thunderstorm with hail
    return 'fa-cloud-question'; // Default
  };

  // Function to get weather description based on weather code
  const getWeatherDescription = (code) => {
    if (code === 0) return 'Clear sky';
    if (code === 1) return 'Mainly clear';
    if (code === 2) return 'Partly cloudy';
    if (code === 3) return 'Overcast';
    if (code >= 45 && code <= 48) return 'Fog';
    if (code >= 51 && code <= 55) return 'Drizzle';
    if (code >= 56 && code <= 57) return 'Freezing Drizzle';
    if (code >= 61 && code <= 65) return 'Rain';
    if (code >= 66 && code <= 67) return 'Freezing Rain';
    if (code >= 71 && code <= 77) return 'Snow';
    if (code >= 80 && code <= 82) return 'Rain showers';
    if (code >= 85 && code <= 86) return 'Snow showers';
    if (code === 95) return 'Thunderstorm';
    if (code >= 96 && code <= 99) return 'Thunderstorm with hail';
    return 'Unknown';
  };

  // Format time from ISO string
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="weather-container expanded">
      <div className="weather-header">
        <h3>Weather{locationName && ` - ${locationName}`}</h3>
        <div className="weather-controls">
          <button className="close-button" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div className="weather-content">
        {loading && <div className="weather-loading"><i className="fas fa-spinner fa-spin"></i> Loading weather data...</div>}
        
        {error && <div className="weather-error"><i className="fas fa-exclamation-circle"></i> {error}</div>}
        
        {!loading && !error && weather && (
          <>
            <div className="current-weather">
              <div className="weather-icon">
                <i className={`fas ${getWeatherIcon(weather.current.weather_code)}`}></i>
              </div>
              <div className="weather-info">
                <div className="temperature">{Math.round(weather.current.temperature_2m)}°C</div>
                <div className="description">{getWeatherDescription(weather.current.weather_code)}</div>
                <div className="feels-like">Feels like: {Math.round(weather.current.apparent_temperature)}°C</div>
              </div>
            </div>

            <div className="weather-details">
              <div className="weather-stats">
                <div className="stat">
                  <i className="fas fa-wind"></i> 
                  <span>{weather.current.wind_speed_10m} {weather.current_units.wind_speed_10m}</span>
                </div>
                <div className="stat">
                  <i className="fas fa-compass"></i> 
                  <span>{weather.current.wind_direction_10m}°</span>
                </div>
                <div className="stat">
                  <i className="fas fa-tint"></i> 
                  <span>{weather.current.relative_humidity_2m}%</span>
                </div>
                <div className="stat">
                  <i className="fas fa-cloud-rain"></i> 
                  <span>{weather.current.precipitation} {weather.current_units.precipitation}</span>
                </div>
              </div>

              <div className="sun-times">
                <div className="sunrise">
                  <i className="fas fa-sun"></i> 
                  <span>Sunrise: {formatTime(weather.daily.sunrise[0])}</span>
                </div>
                <div className="sunset">
                  <i className="fas fa-moon"></i> 
                  <span>Sunset: {formatTime(weather.daily.sunset[0])}</span>
                </div>
              </div>

              <div className="forecast">
                <h4>Daily Forecast</h4>
                <div className="forecast-items">
                  {weather.daily.time.slice(0, 3).map((day, index) => (
                    <div className="forecast-item" key={index}>
                      <div className="forecast-day">{formatDate(day)}</div>
                      <i className={`fas ${getWeatherIcon(weather.daily.weather_code[index])}`}></i>
                      <div className="forecast-temp">
                        <span className="max">{Math.round(weather.daily.temperature_2m_max[index])}°</span>
                        <span className="min">{Math.round(weather.daily.temperature_2m_min[index])}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hourly-forecast">
                <h4>Hourly Forecast</h4>
                <div className="hourly-items">
                  {weather.hourly.time.slice(0, 6).map((time, index) => (
                    <div className="hourly-item" key={index}>
                      <div className="hourly-time">{formatTime(time)}</div>
                      <i className={`fas ${getWeatherIcon(weather.hourly.weather_code[index])}`}></i>
                      <div className="hourly-temp">{Math.round(weather.hourly.temperature_2m[index])}°</div>
                      <div className="hourly-precip">{weather.hourly.precipitation_probability[index]}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Weather; 