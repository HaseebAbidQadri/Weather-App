import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye, Gauge, CloudSnow, Star, Sunrise, Sunset, Moon, Navigation, TrendingUp, Share2, RefreshCw, AlertTriangle, ChevronDown, ChevronUp, Moon as MoonIcon, Sun as SunIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function WeatherApp() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCelsius, setIsCelsius] = useState(true);
  const [isDark, setIsDark] = useState(false); // Dark mode state
  const [searchHistory, setSearchHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showShareMessage, setShowShareMessage] = useState(false);
  // Expandable sections states
  const [showCurrentDetails, setShowCurrentDetails] = useState(true);
  const [showAstro, setShowAstro] = useState(true);
  const [showPrecip, setShowPrecip] = useState(true);
  const [showForecast, setShowForecast] = useState(true);
  const [currentDay, setCurrentDay] = useState(new Date().toDateString());

  const API_KEY = '5fb34ce99b98448fb6a171207251310';

  const popularCities = ['New York', 'London', 'Tokyo', 'Dubai', 'Paris', 'Sydney','yakutsk','moscow','beijing','shanghai'];

  // Dynamic gradient based on temp and mode
  const getGradient = () => {
    if (!weather) return isDark 
      ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' 
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    const temp = weather.current.temp_c;
    if (temp < 0) return isDark 
      ? 'linear-gradient(135deg, #0c4a6b 0%, #0e7490 100%)' 
      : 'linear-gradient(135deg, #1e3a8a 0%, #0891b2 100%)';
    if (temp < 15) return isDark 
      ? 'linear-gradient(135deg, #1e40af 0%, #0ea5e9 100%)' 
      : 'linear-gradient(135deg, #2563eb 0%, #14b8a6 100%)';
    if (temp < 25) return isDark 
      ? 'linear-gradient(135deg, #059669 0%, #0284c7 100%)' 
      : 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)';
    return isDark 
      ? 'linear-gradient(135deg, #dc2626 0%, #7c2d12 100%)' 
      : 'linear-gradient(135deg, #f97316 0%, #a855f7 100%)';
  };

  // Glassmorphism styles adjusted for dark/light
  const glassStyle = {
    backdropFilter: 'blur(20px)',
    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.1)',
    border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(255, 255, 255, 0.2)'}`,
    boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.5)' : '0 8px 32px rgba(0, 0, 0, 0.25)',
  };

  const textColor = isDark ? '#f1f5f9' : '#ffffff';
  const subTextColor = isDark ? '#cbd5e1' : 'rgba(255, 255, 255, 0.8)';

  const fetchWeatherByCoords = async (lat, lon) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=4&aqi=yes`
      );
      const data = await response.json();
      if (response.ok) {
        setWeather(data);
        // Filter forecast to start from today and include next 3 days, removing any past days
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const filteredForecast = data.forecast.forecastday.filter(day => {
          const dayDate = new Date(day.date);
          dayDate.setHours(0, 0, 0, 0);
          return dayDate.getTime() >= today.getTime();
        }).slice(0, 4); // Exactly 4 days: today + next 3
        setForecast(filteredForecast);
        setLastUpdated(new Date());
      } else {
        setError('Unable to fetch weather data.');
        setWeather(null);
        setForecast(null);
      }
    } catch (err) {
      setError('Failed to fetch weather data. Please check your connection.');
      setWeather(null);
      setForecast(null);
    }
    setLoading(false);
  };

  const getCurrentLocation = () => {
    setLoading(true);
    setError('');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherByCoords(latitude, longitude);
        },
        (error) => {
          setLoading(false);
          setError('Unable to get your location. Please search manually.');
          // Fallback to default city
          setTimeout(() => fetchWeather('London'), 1000);
        }
      );
    } else {
      setLoading(false);
      setError('Geolocation is not supported by your browser.');
      setTimeout(() => fetchWeather('London'), 1000);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Auto-refetch if day changes (checks every minute)
  useEffect(() => {
    const interval = setInterval(() => {
      const nowDay = new Date().toDateString();
      if (nowDay !== currentDay) {
        setCurrentDay(nowDay);
        if (weather) {
          fetchWeather(weather.location.name);
        } else {
          getCurrentLocation();
        }
      }
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [currentDay, weather]);

  useEffect(() => {
    // Load from localStorage
    const savedHistory = localStorage.getItem('searchHistory');
    const savedFavorites = localStorage.getItem('favorites');
    if (savedHistory) setSearchHistory(JSON.parse(savedHistory));
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
  }, []);

  useEffect(() => {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [searchHistory, favorites]);

  const fetchWeather = async (cityName) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${cityName}&days=4&aqi=yes`
      );
      const data = await response.json();
      if (response.ok) {
        setWeather(data);
        // Filter forecast to start from today and include next 3 days, removing any past days
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const filteredForecast = data.forecast.forecastday.filter(day => {
          const dayDate = new Date(day.date);
          dayDate.setHours(0, 0, 0, 0);
          return dayDate.getTime() >= today.getTime();
        }).slice(0, 4); // Exactly 4 days: today + next 3
        setForecast(filteredForecast);
        setLastUpdated(new Date());
        if (!searchHistory.includes(cityName)) {
          setSearchHistory([cityName, ...searchHistory.slice(0, 4)]);
        }
      } else {
        setError('City not found. Please try again.');
        setWeather(null);
        setForecast(null);
      }
    } catch (err) {
      setError('Failed to fetch weather data.');
      setWeather(null);
      setForecast(null);
    }
    setLoading(false);
  };

  const handleSearch = () => {
    if (city.trim()) {
      fetchWeather(city);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleFavorite = (cityName) => {
    if (favorites.includes(cityName)) {
      setFavorites(favorites.filter(fav => fav !== cityName));
    } else {
      setFavorites([...favorites, cityName]);
    }
  };

  const isFavorite = (cityName) => {
    return favorites.includes(cityName);
  };

  const shareWeather = () => {
    if (weather) {
      const text = `Weather in ${weather.location.name}: ${convertTemp(weather.current.temp_c)}°${isCelsius ? 'C' : 'F'}, ${weather.current.condition.text}`;
      navigator.clipboard.writeText(text);
      setShowShareMessage(true);
      setTimeout(() => setShowShareMessage(false), 3000);
    }
  };

  const getWeatherIcon = (condition) => {
    const text = condition?.toLowerCase() || '';
    if (text.includes('rain')) return <CloudRain size={96} color={textColor} />;
    if (text.includes('snow')) return <CloudSnow size={96} color={textColor} />;
    if (text.includes('cloud')) return <Cloud size={96} color={textColor} />;
    return <Sun size={96} color={textColor} />;
  };

  const getSmallWeatherIcon = (condition) => {
    const text = condition?.toLowerCase() || '';
    if (text.includes('rain')) return <CloudRain size={32} color={textColor} />;
    if (text.includes('snow')) return <CloudSnow size={32} color={textColor} />;
    if (text.includes('cloud')) return <Cloud size={32} color={textColor} />;
    return <Sun size={32} color={textColor} />;
  };

  const convertTemp = (tempC) => {
    return isCelsius ? Math.round(tempC) : Math.round((tempC * 9/5) + 32);
  };

  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const forecastDate = new Date(date);
    forecastDate.setHours(0, 0, 0, 0);
    
    const diffTime = forecastDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === 2) return 'Day 3';
    if (diffDays === 3) return 'Day 4';
    
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getMoonPhase = (phaseText) => {
    const phase = phaseText?.toLowerCase() || '';
    if (phase.includes('new')) return '🌑';
    if (phase.includes('waxing crescent')) return '🌒';
    if (phase.includes('first quarter')) return '🌓';
    if (phase.includes('waxing gibbous')) return '🌔';
    if (phase.includes('full')) return '🌕';
    if (phase.includes('waning gibbous')) return '🌖';
    if (phase.includes('last quarter')) return '🌗';
    if (phase.includes('waning crescent')) return '🌘';
    return '🌙';
  };

  const getUVLevel = (uv) => {
    if (uv <= 2) return { text: 'Low', color: '#10b981' };
    if (uv <= 5) return { text: 'Moderate', color: '#f59e0b' };
    if (uv <= 7) return { text: 'High', color: '#ef4444' };
    if (uv <= 10) return { text: 'Very High', color: '#dc2626' };
    return { text: 'Extreme', color: '#991b1b' };
  };

  const getAQILevel = (aqi) => {
    if (aqi <= 50) return { text: 'Good', color: '#10b981' };
    if (aqi <= 100) return { text: 'Moderate', color: '#f59e0b' };
    if (aqi <= 150) return { text: 'Unhealthy for Sensitive', color: '#ef4444' };
    if (aqi <= 200) return { text: 'Unhealthy', color: '#dc2626' };
    if (aqi <= 300) return { text: 'Very Unhealthy', color: '#991b1b' };
    return { text: 'Hazardous', color: '#7f1d1d' };
  };

  const getWindDirection = (degree) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degree / 45) % 8;
    return directions[index];
  };

  const getWindSpeed = () => {
    return isCelsius ? `${weather.current.wind_kph} km/h` : `${Math.round(weather.current.wind_kph * 0.621371)} mph`;
  };

  const getTempChartData = () => {
    if (!forecast) return [];
    return forecast.map(day => ({
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      max: isCelsius ? Math.round(day.day.maxtemp_c) : Math.round(day.day.maxtemp_f),
      min: isCelsius ? Math.round(day.day.mintemp_c) : Math.round(day.day.mintemp_f)
    }));
  };

  const ExpandableSection = ({ title, children, isOpen, onToggle }) => (
    <div className="expandable-section" style={{ ...glassStyle, marginBottom: '1rem', borderRadius: '16px', overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '1rem 2rem',
          background: 'transparent',
          border: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: textColor,
          fontSize: '1.25rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
      >
        {title}
        {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
      </button>
      <div style={{ maxHeight: isOpen ? '100%' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
        <div style={{ padding: '1rem 2rem' }}>
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <div 
      style={{ 
        minHeight: '100vh', 
        background: getGradient(), 
        position: 'relative',
        transition: 'background 0.5s ease'
      }}
    >
      {/* Full-width header */}
      <header style={{ width: '100%', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: textColor, margin: 0 }}>
          Ultimate Weather App ⛅
        </h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => setIsDark(!isDark)}
            style={{
              padding: '0.5rem',
              background: 'transparent',
              border: 'none',
              color: textColor,
              cursor: 'pointer',
              borderRadius: '50%',
              ...glassStyle,
            }}
          >
            {isDark ? <SunIcon size={24} /> : <MoonIcon size={24} />}
          </button>
        </div>
      </header>

      <main style={{ width: '100%', padding: '0 2rem', maxWidth: 'none' }}>
        {/* Search Section - Full width */}
        <section style={{ ...glassStyle, padding: '2rem', borderRadius: '16px', marginBottom: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <p style={{ color: subTextColor, fontSize: '0.875rem', marginBottom: '1rem' }}>🏙️ Popular Cities:</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {popularCities.map((popularCity, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCity(popularCity);
                    fetchWeather(popularCity);
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(255, 255, 255, 0.25)',
                    border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.3)' : 'rgba(255, 255, 255, 0.3)'}`,
                    borderRadius: '20px',
                    color: textColor,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontWeight: '600'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = isDark ? 'rgba(71, 85, 105, 0.8)' : 'rgba(255, 255, 255, 0.4)';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(255, 255, 255, 0.25)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  {popularCity}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsCelsius(!isCelsius)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(255, 255, 255, 0.3)',
                border: 'none',
                borderRadius: '50px',
                color: textColor,
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                ...glassStyle,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = isDark ? 'rgba(71, 85, 105, 0.8)' : 'rgba(255, 255, 255, 0.5)';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'scale(1)';
              }}
            >
              {isCelsius ? '°C' : '°F'} | Switch to {isCelsius ? '°F' : '°C'}
            </button>

            {weather && (
              <>
                <button
                  onClick={() => fetchWeather(weather.location.name)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(255, 255, 255, 0.3)',
                    border: 'none',
                    borderRadius: '50px',
                    color: textColor,
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    ...glassStyle,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = isDark ? 'rgba(71, 85, 105, 0.8)' : 'rgba(255, 255, 255, 0.5)';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(255, 255, 255, 0.3)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  <RefreshCw size={16} /> Refresh
                </button>

                <button
                  onClick={shareWeather}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(255, 255, 255, 0.3)',
                    border: 'none',
                    borderRadius: '50px',
                    color: textColor,
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    ...glassStyle,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = isDark ? 'rgba(71, 85, 105, 0.8)' : 'rgba(255, 255, 255, 0.5)';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(255, 255, 255, 0.3)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  <Share2 size={16} /> Share
                </button>
              </>
            )}
          </div>

          {showShareMessage && (
            <div style={{
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.3)',
              ...glassStyle,
              color: textColor,
              padding: '1rem',
              borderRadius: '12px',
              textAlign: 'center',
              marginBottom: '1rem',
            }}>
              ✅ Weather info copied to clipboard!
            </div>
          )}

          {lastUpdated && (
            <div style={{ textAlign: 'center', color: subTextColor, fontSize: '0.75rem', marginBottom: '1rem' }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}

          {/* Favorites & History - Full width sub-sections */}
          {(favorites.length > 0 || searchHistory.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              {favorites.length > 0 && (
                <div style={{ ...glassStyle, padding: '1rem', borderRadius: '12px' }}>
                  <p style={{ color: subTextColor, fontSize: '0.875rem', marginBottom: '0.5rem', textAlign: 'center' }}>⭐ Favorites:</p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {favorites.map((favCity, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCity(favCity);
                          fetchWeather(favCity);
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: 'rgba(251, 191, 36, 0.3)',
                          border: `1px solid rgba(251, 191, 36, 0.5)`,
                          borderRadius: '20px',
                          color: textColor,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          fontWeight: '600'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = 'rgba(251, 191, 36, 0.5)';
                          e.target.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'rgba(251, 191, 36, 0.3)';
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        ⭐ {favCity}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {searchHistory.length > 0 && !loading && (
                <div style={{ ...glassStyle, padding: '1rem', borderRadius: '12px' }}>
                  <p style={{ color: subTextColor, fontSize: '0.875rem', marginBottom: '0.5rem', textAlign: 'center' }}>📝 Recent:</p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {searchHistory.map((historyCity, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCity(historyCity);
                          fetchWeather(historyCity);
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(255, 255, 255, 0.2)',
                          border: 'none',
                          borderRadius: '20px',
                          color: textColor,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = isDark ? 'rgba(71, 85, 105, 0.8)' : 'rgba(255, 255, 255, 0.4)';
                          e.target.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(255, 255, 255, 0.2)';
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        {historyCity}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ position: 'relative', marginBottom: '2rem' }}>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter city name..."
              style={{
                width: '100%',
                padding: '1rem 5rem 1rem 1.5rem',
                borderRadius: '50px',
                border: 'none',
                backgroundColor: isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(255, 255, 255, 0.3)',
                ...glassStyle,
                color: textColor,
                fontSize: '1.125rem',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
            />
            <button
              onClick={getCurrentLocation}
              style={{
                position: 'absolute',
                right: '3.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '0.75rem',
                backgroundColor: isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(255, 255, 255, 0.4)',
                border: 'none',
                borderRadius: '50%',
                color: textColor,
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '1.2rem'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = isDark ? 'rgba(71, 85, 105, 0.8)' : 'rgba(255, 255, 255, 0.6)';
                e.target.style.transform = 'translateY(-50%) scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(255, 255, 255, 0.4)';
                e.target.style.transform = 'translateY(-50%) scale(1)';
              }}
              title="Use my location"
            >
              📍
            </button>
            <button
              onClick={handleSearch}
              style={{
                position: 'absolute',
                right: '0.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '0.75rem 1.5rem',
                backgroundColor: isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(255, 255, 255, 0.4)',
                border: 'none',
                borderRadius: '50px',
                color: textColor,
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = isDark ? 'rgba(71, 85, 105, 0.8)' : 'rgba(255, 255, 255, 0.6)';
                e.target.style.transform = 'translateY(-50%) scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(255, 255, 255, 0.4)';
                e.target.style.transform = 'translateY(-50%) scale(1)';
              }}
            >
              Search
            </button>
          </div>
        </section>

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div className="spinner"></div>
          </div>
        )}

        {error && (
          <div style={{
            ...glassStyle,
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            color: textColor,
            padding: '1rem 2rem',
            borderRadius: '16px',
            textAlign: 'center',
            marginBottom: '2rem',
          }}>
            {error}
          </div>
        )}

        {weather && !loading && (
          <>
            {/* Current Weather Header */}
            <section style={{ ...glassStyle, padding: '2rem', borderRadius: '16px', marginBottom: '2rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: textColor, margin: 0 }}>
                  {weather.location.name}, {weather.location.country}
                </h2>
                <button
                  onClick={() => toggleFavorite(weather.location.name)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    transition: 'transform 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  {isFavorite(weather.location.name) ? '⭐' : '☆'}
                </button>
              </div>
              <p style={{ color: subTextColor, fontSize: '1.125rem', margin: '0.5rem 0' }}>
                {new Date(weather.location.localtime).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2rem 0', animation: 'float 3s ease-in-out infinite' }}>
                {getWeatherIcon(weather.current.condition.text)}
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '4.5rem', fontWeight: 'bold', color: textColor, marginBottom: '0.5rem' }}>
                  {convertTemp(weather.current.temp_c)}°{isCelsius ? 'C' : 'F'}
                </div>
                <div style={{ fontSize: '1.5rem', color: subTextColor, textTransform: 'capitalize' }}>
                  {weather.current.condition.text}
                </div>
              </div>
            </section>

            {/* Expandable Astro */}
            {forecast && forecast[0] && (
              <ExpandableSection
                title="🌅 Astronomy"
                isOpen={showAstro}
                onToggle={() => setShowAstro(!showAstro)}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div style={{ ...glassStyle, padding: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Sunrise size={40} color={textColor} />
                    <div>
                      <div style={{ color: subTextColor, fontSize: '0.875rem' }}>Sunrise</div>
                      <div style={{ color: textColor, fontWeight: 'bold', fontSize: '1.5rem' }}>{forecast[0].astro.sunrise}</div>
                    </div>
                  </div>
                  <div style={{ ...glassStyle, padding: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Sunset size={40} color={textColor} />
                    <div>
                      <div style={{ color: subTextColor, fontSize: '0.875rem' }}>Sunset</div>
                      <div style={{ color: textColor, fontWeight: 'bold', fontSize: '1.5rem' }}>{forecast[0].astro.sunset}</div>
                    </div>
                  </div>
                  <div style={{ ...glassStyle, padding: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Moon size={40} color={textColor} />
                    <div>
                      <div style={{ color: subTextColor, fontSize: '0.875rem' }}>Moon Phase</div>
                      <div style={{ color: textColor, fontWeight: 'bold', fontSize: '1.5rem' }}>
                        {getMoonPhase(forecast[0].astro.moon_phase)} {forecast[0].astro.moon_phase}
                      </div>
                      <div style={{ color: subTextColor, fontSize: '0.75rem' }}>Illumination: {forecast[0].astro.moon_illumination}%</div>
                    </div>
                  </div>
                </div>
              </ExpandableSection>
            )}

            {/* Expandable UV & AQI */}
            {weather.current.air_quality && (
              <ExpandableSection
                title="☀️ UV & Air Quality"
                isOpen={true} // Always open for key info
                onToggle={() => {}} // No toggle needed
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div style={{ ...glassStyle, padding: '1.5rem', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <Sun size={32} color={textColor} />
                      <div style={{ color: textColor, fontWeight: 'bold', fontSize: '1.25rem' }}>UV Index</div>
                    </div>
                    <div style={{ color: textColor, fontWeight: 'bold', fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                      {weather.current.uv}
                    </div>
                    <div style={{
                      backgroundColor: getUVLevel(weather.current.uv).color,
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      display: 'inline-block',
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}>
                      {getUVLevel(weather.current.uv).text}
                    </div>
                  </div>
                  <div style={{ ...glassStyle, padding: '1.5rem', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <Droplets size={32} color={textColor} /> {/* Reuse for AQI */}
                      <div style={{ color: textColor, fontWeight: 'bold', fontSize: '1.25rem' }}>Air Quality</div>
                    </div>
                    <div style={{ color: textColor, fontWeight: 'bold', fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                      {Math.round(weather.current.air_quality['us-epa-index'] * 50)}
                    </div>
                    <div style={{
                      backgroundColor: getAQILevel(weather.current.air_quality['us-epa-index'] * 50).color,
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      display: 'inline-block',
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}>
                      {getAQILevel(weather.current.air_quality['us-epa-index'] * 50).text}
                    </div>
                  </div>
                </div>
              </ExpandableSection>
            )}

            {/* Expandable Precip */}
            {forecast && forecast[0] && (
              <ExpandableSection
                title="🌧️ Precipitation"
                isOpen={showPrecip}
                onToggle={() => setShowPrecip(!showPrecip)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CloudRain size={32} color={textColor} />
                    <div>
                      <div style={{ color: textColor, fontWeight: 'bold', fontSize: '1.25rem' }}>Chance</div>
                      <div style={{ color: subTextColor, fontSize: '0.875rem' }}>Today's forecast</div>
                    </div>
                  </div>
                  <div style={{ ...glassStyle, borderRadius: '12px', padding: '1rem 1.5rem', textAlign: 'center' }}>
                    <div style={{ color: textColor, fontWeight: 'bold', fontSize: '2rem' }}>{forecast[0].day.daily_chance_of_rain}%</div>
                    <div style={{ color: subTextColor, fontSize: '0.75rem' }}>Rain</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                  <div style={{ ...glassStyle, padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ color: subTextColor, fontSize: '0.75rem', marginBottom: '0.25rem' }}>Snow Chance</div>
                    <div style={{ color: textColor, fontWeight: 'bold', fontSize: '1.25rem' }}>{forecast[0].day.daily_chance_of_snow}%</div>
                  </div>
                  <div style={{ ...glassStyle, padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ color: subTextColor, fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                      {isCelsius ? 'Total Rain (mm)' : 'Total Rain (in)'}
                    </div>
                    <div style={{ color: textColor, fontWeight: 'bold', fontSize: '1.25rem' }}>
                      {isCelsius ? forecast[0].day.totalprecip_mm.toFixed(1) : forecast[0].day.totalprecip_in.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ ...glassStyle, padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ color: subTextColor, fontSize: '0.75rem', marginBottom: '0.25rem' }}>Avg Humidity</div>
                    <div style={{ color: textColor, fontWeight: 'bold', fontSize: '1.25rem' }}>{forecast[0].day.avghumidity}%</div>
                  </div>
                </div>
                {(forecast[0].day.daily_chance_of_rain > 70 || forecast[0].day.daily_chance_of_snow > 70) && (
                  <div style={{
                    marginTop: '1rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.3)',
                    ...glassStyle,
                    borderRadius: '12px',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}>
                    <AlertTriangle size={24} color={textColor} />
                    <div>
                      <div style={{ color: textColor, fontWeight: 'bold', fontSize: '0.875rem' }}>Weather Alert</div>
                      <div style={{ color: subTextColor, fontSize: '0.75rem' }}>
                        High chance of {forecast[0].day.daily_chance_of_rain > 70 ? 'rain' : 'snow'} today. Don't forget your {forecast[0].day.daily_chance_of_rain > 70 ? 'umbrella' : 'warm clothes'}!
                      </div>
                    </div>
                  </div>
                )}
              </ExpandableSection>
            )}

            {/* Expandable Current Details */}
            <ExpandableSection
              title="💨 Current Details"
              isOpen={showCurrentDetails}
              onToggle={() => setShowCurrentDetails(!showCurrentDetails)}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                <div style={{ ...glassStyle, padding: '1rem', borderRadius: '12px', transition: 'all 0.3s ease', cursor: 'pointer' }} className="weather-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: textColor }}>
                    <Navigation size={24} style={{ transform: `rotate(${weather.current.wind_degree}deg)`, color: textColor }} />
                    <span style={{ color: subTextColor, fontSize: '0.875rem' }}>Wind Direction</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: textColor }}>
                    {getWindDirection(weather.current.wind_degree)} ({weather.current.wind_degree}°)
                  </div>
                </div>
                <div style={{ ...glassStyle, padding: '1rem', borderRadius: '12px', transition: 'all 0.3s ease', cursor: 'pointer' }} className="weather-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: textColor }}>
                    <Wind size={24} color={textColor} />
                    <span style={{ color: subTextColor, fontSize: '0.875rem' }}>Wind Speed</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: textColor }}>
                    {getWindSpeed()}
                  </div>
                </div>
                <div style={{ ...glassStyle, padding: '1rem', borderRadius: '12px', transition: 'all 0.3s ease', cursor: 'pointer' }} className="weather-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: textColor }}>
                    <Droplets size={24} color={textColor} />
                    <span style={{ color: subTextColor, fontSize: '0.875rem' }}>Humidity</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: textColor }}>
                    {weather.current.humidity}%
                  </div>
                </div>
                <div style={{ ...glassStyle, padding: '1rem', borderRadius: '12px', transition: 'all 0.3s ease', cursor: 'pointer' }} className="weather-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: textColor }}>
                    <Eye size={24} color={textColor} />
                    <span style={{ color: subTextColor, fontSize: '0.875rem' }}>Visibility</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: textColor }}>
                    {weather.current.vis_km} km
                  </div>
                </div>
                <div style={{ ...glassStyle, padding: '1rem', borderRadius: '12px', transition: 'all 0.3s ease', cursor: 'pointer' }} className="weather-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: textColor }}>
                    <Gauge size={24} color={textColor} />
                    <span style={{ color: subTextColor, fontSize: '0.875rem' }}>Pressure</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: textColor }}>
                    {weather.current.pressure_mb} mb
                  </div>
                </div>
                <div style={{ ...glassStyle, padding: '1rem', borderRadius: '12px', transition: 'all 0.3s ease', cursor: 'pointer' }} className="weather-card">
                  <div style={{ color: subTextColor, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Feels Like</div>
                  <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: textColor }}>
                    {convertTemp(weather.current.feelslike_c)}°{isCelsius ? 'C' : 'F'}
                  </div>
                </div>
              </div>
            </ExpandableSection>

            {/* Temperature Chart - Full width */}
            {forecast && forecast.length > 0 && (
              <section style={{ ...glassStyle, padding: '2rem', borderRadius: '16px', marginBottom: '2rem' }}>
                <h3 style={{ color: textColor, fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={24} color={textColor} /> Temperature Trend
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={getTempChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={subTextColor} />
                    <XAxis dataKey="date" stroke={textColor} />
                    <YAxis domain={['dataMin - 5', 'dataMax + 5']} stroke={textColor} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(0,0,0,0.8)', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: textColor
                      }}
                    />
                    <Line type="monotone" dataKey="max" stroke="#ef4444" strokeWidth={3} name="Max Temp" />
                    <Line type="monotone" dataKey="min" stroke="#3b82f6" strokeWidth={3} name="Min Temp" />
                  </LineChart>
                </ResponsiveContainer>
              </section>
            )}

            {/* Expandable 4-Day Forecast */}
            {forecast && forecast.length > 0 && (
              <ExpandableSection
                title="📅 4-Day Forecast"
                isOpen={showForecast}
                onToggle={() => setShowForecast(!showForecast)}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                  {forecast.map((day, index) => {
                    const forecastDate = new Date(day.date);
                    return (
                      <div
                        key={day.date}
                        className="forecast-card"
                        style={{
                          ...glassStyle,
                          padding: '1rem',
                          borderRadius: '12px',
                          textAlign: 'center',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ color: textColor, fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                          {getDayName(day.date)}
                        </div>
                        <div style={{ color: subTextColor, fontSize: '0.7rem', marginBottom: '0.5rem' }}>
                          {forecastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                          {getSmallWeatherIcon(day.day.condition.text)}
                        </div>
                        <div style={{ color: textColor, fontWeight: 'bold', fontSize: '1.25rem' }}>
                          {isCelsius ? Math.round(day.day.maxtemp_c) : Math.round(day.day.maxtemp_f)}°
                        </div>
                        <div style={{ color: subTextColor, fontSize: '0.875rem' }}>
                          {isCelsius ? Math.round(day.day.mintemp_c) : Math.round(day.day.mintemp_f)}°
                        </div>
                        <div style={{ color: subTextColor, fontSize: '0.7rem', textTransform: 'capitalize' }}>
                          {day.day.condition.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ExpandableSection>
            )}
          </>
        )}
      </main>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-sizing: border-box;
        }

        input::placeholder {
          color: ${subTextColor};
        }

        input:focus {
          box-shadow: 0 0 0 2px ${isDark ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.5)'};
        }

        .spinner {
          display: inline-block;
          width: 48px;
          height: 48px;
          border: 4px solid ${isDark ? 'rgba(148, 163, 184, 0.3)' : 'rgba(255, 255, 255, 0.3)'};
          border-top-color: ${textColor};
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .weather-card:hover {
          transform: scale(1.05);
          background-color: ${isDark ? 'rgba(71, 85, 105, 0.8)' : 'rgba(255, 255, 255, 0.3)'} !important;
        }

        .forecast-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          header { flex-direction: column; gap: 1rem; text-align: center; }
          main { padding: 0 1rem; }
          .expandable-section button { font-size: 1rem; padding: 0.75rem 1rem; }
          .forecast-card { padding: 0.75rem !important; }
        }

        @media (max-width: 480px) {
          input { padding: 0.75rem 4rem 0.75rem 1rem !important; font-size: 1rem !important; }
          .search-buttons { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}