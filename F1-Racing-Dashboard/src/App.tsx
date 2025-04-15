import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Clock, 
  Flag, 
  Settings, 
  Search, 
  RefreshCw, 
  CloudRain, 
  MapPin, 
  Calendar, 
  ChevronDown, 
  BarChart, 
  LineChart, 
  Timer, 
  Users
} from 'lucide-react';
import Chart from 'chart.js/auto';

interface Driver {
  driverId: string;
  code: string;
  permanentNumber: string;
  givenName: string;
  familyName: string;
  nationality: string;
}

interface Constructor {
  constructorId: string;
  name: string;
  nationality: string;
}

interface Time {
  millis: string;
  time: string;
}

interface Result {
  position: string;
  positionText: string;
  points: string;
  Driver: Driver;
  Constructor: Constructor;
  grid: string;
  laps: string;
  status: string;
  Time?: Time;
  FastestLap?: {
    rank: string;
    lap: string;
    Time: {
      time: string;
    };
    AverageSpeed: {
      units: string;
      speed: string;
    };
  };
}

interface Circuit {
  circuitId: string;
  circuitName: string;
  Location: {
    lat: string;
    long: string;
    locality: string;
    country: string;
  };
}

interface Race {
  season: string;
  round: string;
  raceName: string;
  Circuit: Circuit;
  date: string;
  time: string;
  Results: Result[];
}

interface RaceData {
  MRData: {
    RaceTable: {
      Races: Race[];
    };
  };
}

function App() {
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedRace, setSelectedRace] = useState<string>('last');
  const [currentRaceData, setCurrentRaceData] = useState<RaceData | null>(null);
  const [driver1, setDriver1] = useState<string>('');
  const [driver2, setDriver2] = useState<string>('');
  const [comparisonResult, setComparisonResult] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [weather, setWeather] = useState<string>('Loading weather data...');
  const [circuitRecords, setCircuitRecords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(true);

  const lapTimeChartRef = useRef<Chart | null>(null);
  const positionChartRef = useRef<Chart | null>(null);
  const speedChartRef = useRef<Chart | null>(null);
  const lapTimeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const positionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const speedCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fetch all races for the season
  useEffect(() => {
    async function fetchRaces() {
      try {
        setIsLoading(true);
        const response = await fetch("https://ergast.com/api/f1/current.json");
        const data = await response.json();
        setRaces(data.MRData.RaceTable.Races);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching races:", error);
        setIsLoading(false);
      }
    }

    fetchRaces();
  }, []);

  // Fetch race data when selected race changes
  useEffect(() => {
    if (selectedRace) {
      fetchRaceData(selectedRace);
    }
  }, [selectedRace]);

  // Initialize and update charts when race data changes
  useEffect(() => {
    if (currentRaceData && lapTimeCanvasRef.current && positionCanvasRef.current && speedCanvasRef.current) {
      updateCharts();
    }
  }, [currentRaceData]);

  // Fetch race data for the selected race
  async function fetchRaceData(round = "last") {
    try {
      setIsLoading(true);
      const response = await fetch(`https://ergast.com/api/f1/current/${round}/results.json`);
      const data = await response.json();
      setCurrentRaceData(data);
      
      // Simulate fetching weather data
      simulateWeatherData();
      
      // Simulate fetching circuit records
      simulateCircuitRecords(data);
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching race data:", error);
      setIsLoading(false);
    }
  }

  // Simulate weather data (since the real API isn't available)
  function simulateWeatherData() {
    const weatherConditions = [
      "Sunny, 24°C, Wind: 12 km/h",
      "Partly Cloudy, 22°C, Wind: 8 km/h",
      "Overcast, 19°C, Wind: 15 km/h",
      "Light Rain, 18°C, Wind: 20 km/h",
      "Clear, 26°C, Wind: 5 km/h"
    ];
    
    setWeather(weatherConditions[Math.floor(Math.random() * weatherConditions.length)]);
  }

  // Simulate circuit records (since the real API isn't available)
  function simulateCircuitRecords(data: RaceData) {
    if (!data.MRData.RaceTable.Races[0]) return;
    
    const circuitName = data.MRData.RaceTable.Races[0].Circuit.circuitName;
    const records = [
      `Lap Record: 1:21.046 - Lewis Hamilton (2020)`,
      `Pole Position: 1:19.273 - Max Verstappen (2021)`,
      `Most Wins: 8 - Lewis Hamilton`,
      `First Grand Prix: 1950`
    ];
    
    setCircuitRecords(records);
  }

  // Update charts with race data
  function updateCharts() {
    if (!currentRaceData || !currentRaceData.MRData.RaceTable.Races[0]) return;
    
    const raceResults = currentRaceData.MRData.RaceTable.Races[0].Results;
    
    // Prepare data for charts
    const drivers = raceResults.map(result => result.Driver.code || result.Driver.familyName);
    const positions = raceResults.map(result => parseInt(result.position));
    
    // Create lap time data (convert time strings to seconds)
    const lapTimes = raceResults.map(result => {
      if (result.FastestLap?.Time?.time) {
        const timeStr = result.FastestLap.Time.time;
        const minutes = timeStr.includes(':') ? parseInt(timeStr.split(':')[0]) : 0;
        const seconds = parseFloat(timeStr.includes(':') ? timeStr.split(':')[1] : timeStr);
        return minutes * 60 + seconds;
      }
      return 0;
    });
    
    // Create speed data
    const speeds = raceResults.map(result => 
      parseFloat(result.FastestLap?.AverageSpeed?.speed || '0')
    );
    
    // Update lap time chart
    if (lapTimeChartRef.current) {
      lapTimeChartRef.current.destroy();
    }
    
    if (lapTimeCanvasRef.current) {
      const ctx1 = lapTimeCanvasRef.current.getContext('2d');
      if (ctx1) {
        lapTimeChartRef.current = new Chart(ctx1, {
          type: 'line',
          data: {
            labels: drivers,
            datasets: [{
              label: 'Fastest Lap Time (seconds)',
              data: lapTimes,
              backgroundColor: 'rgba(75, 192, 192, 0.4)',
              borderColor: 'rgba(75, 192, 192, 1)',
              pointBackgroundColor: '#fff',
              borderWidth: 2,
              tension: 0.1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  color: darkMode ? '#f5f5f5' : '#333'
                }
              },
              tooltip: {
                callbacks: {
                  label: (context) => `${context.dataset.label}: ${context.raw} sec`
                }
              }
            },
            scales: {
              y: {
                ticks: {
                  color: darkMode ? '#f5f5f5' : '#333'
                },
                grid: {
                  color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                }
              },
              x: {
                ticks: {
                  color: darkMode ? '#f5f5f5' : '#333'
                },
                grid: {
                  color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                }
              }
            }
          }
        });
      }
    }
    
    // Update position chart
    if (positionChartRef.current) {
      positionChartRef.current.destroy();
    }
    
    if (positionCanvasRef.current) {
      const ctx2 = positionCanvasRef.current.getContext('2d');
      if (ctx2) {
        positionChartRef.current = new Chart(ctx2, {
          type: 'bar',
          data: {
            labels: drivers,
            datasets: [{
              label: 'Positions',
              data: positions,
              backgroundColor: 'rgba(153, 102, 255, 0.4)',
              borderColor: 'rgba(153, 102, 255, 1)',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  color: darkMode ? '#f5f5f5' : '#333'
                }
              },
              tooltip: {
                callbacks: {
                  label: (context) => `Position: ${context.raw}`
                }
              }
            },
            scales: {
              y: {
                ticks: {
                  color: darkMode ? '#f5f5f5' : '#333'
                },
                grid: {
                  color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                },
                reverse: true // Lower position numbers are better
              },
              x: {
                ticks: {
                  color: darkMode ? '#f5f5f5' : '#333'
                },
                grid: {
                  color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                }
              }
            }
          }
        });
      }
    }
    
    // Update speed chart
    if (speedChartRef.current) {
      speedChartRef.current.destroy();
    }
    
    if (speedCanvasRef.current) {
      const ctx3 = speedCanvasRef.current.getContext('2d');
      if (ctx3) {
        speedChartRef.current = new Chart(ctx3, {
          type: 'radar',
          data: {
            labels: drivers,
            datasets: [{
              label: 'Average Speed (km/h)',
              data: speeds,
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 2,
              pointBackgroundColor: 'rgba(255, 99, 132, 1)',
              pointRadius: 4
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  color: darkMode ? '#f5f5f5' : '#333'
                }
              }
            },
            scales: {
              r: {
                angleLines: {
                  color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                },
                grid: {
                  color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                },
                pointLabels: {
                  color: darkMode ? '#f5f5f5' : '#333'
                },
                ticks: {
                  color: darkMode ? '#f5f5f5' : '#333',
                  backdropColor: darkMode ? '#1e1e1e' : '#f5f5f5'
                }
              }
            }
          }
        });
      }
    }
  }

  // Handle driver comparison
  function compareDrivers() {
    if (!currentRaceData || !driver1 || !driver2) {
      setComparisonResult("Please select two drivers for comparison.");
      return;
    }
    
    const raceResults = currentRaceData.MRData.RaceTable.Races[0].Results;
    const driver1Data = raceResults.find(result => result.Driver.driverId === driver1);
    const driver2Data = raceResults.find(result => result.Driver.driverId === driver2);
    
    if (!driver1Data || !driver2Data) {
      setComparisonResult("Driver data not found.");
      return;
    }
    
    const driver1Position = parseInt(driver1Data.position);
    const driver2Position = parseInt(driver2Data.position);
    const positionDiff = Math.abs(driver1Position - driver2Position);
    
    const driver1LapTime = driver1Data.FastestLap?.Time?.time || 'N/A';
    const driver2LapTime = driver2Data.FastestLap?.Time?.time || 'N/A';
    
    const driver1Speed = driver1Data.FastestLap?.AverageSpeed?.speed || 'N/A';
    const driver2Speed = driver2Data.FastestLap?.AverageSpeed?.speed || 'N/A';
    
    const betterDriver = driver1Position < driver2Position
      ? driver1Data.Driver.givenName + ' ' + driver1Data.Driver.familyName
      : driver2Data.Driver.givenName + ' ' + driver2Data.Driver.familyName;
    
    const isPositionTie = driver1Position === driver2Position;
    
    setComparisonResult(`
      <div class="comparison-details">
        <h4 class="text-xl font-bold mb-2">${driver1Data.Driver.givenName} ${driver1Data.Driver.familyName} vs ${driver2Data.Driver.givenName} ${driver2Data.Driver.familyName}</h4>
        
        <div class="grid grid-cols-3 gap-2 mb-4">
          <div class="text-center">
            <span class="block font-bold">${driver1Data.Driver.code}</span>
          </div>
          <div class="text-center">
            <span class="block text-sm">Comparison</span>
          </div>
          <div class="text-center">
            <span class="block font-bold">${driver2Data.Driver.code}</span>
          </div>
        </div>
        
        <div class="grid grid-cols-3 gap-2 mb-2">
          <div class="text-center">
            <span class="block text-2xl font-bold">${driver1Position}</span>
            <span class="block text-xs">Position</span>
          </div>
          <div class="text-center flex items-center justify-center">
            <span class="block text-sm">${positionDiff} pos. diff</span>
          </div>
          <div class="text-center">
            <span class="block text-2xl font-bold">${driver2Position}</span>
            <span class="block text-xs">Position</span>
          </div>
        </div>
        
        <div class="grid grid-cols-3 gap-2 mb-2">
          <div class="text-center">
            <span class="block font-bold">${driver1LapTime}</span>
            <span class="block text-xs">Fastest Lap</span>
          </div>
          <div class="text-center flex items-center justify-center">
            <span class="block text-sm">Lap Time</span>
          </div>
          <div class="text-center">
            <span class="block font-bold">${driver2LapTime}</span>
            <span class="block text-xs">Fastest Lap</span>
          </div>
        </div>
        
        <div class="grid grid-cols-3 gap-2 mb-2">
          <div class="text-center">
            <span class="block font-bold">${driver1Speed}</span>
            <span class="block text-xs">Avg Speed</span>
          </div>
          <div class="text-center flex items-center justify-center">
            <span class="block text-sm">km/h</span>
          </div>
          <div class="text-center">
            <span class="block font-bold">${driver2Speed}</span>
            <span class="block text-xs">Avg Speed</span>
          </div>
        </div>
        
        <div class="mt-4 p-2 rounded ${isPositionTie ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
          ${isPositionTie 
            ? "Both drivers are tied based on position." 
            : `${betterDriver} is in a higher position.`}
        </div>
      </div>
    `);
  }

  // Filter drivers based on search term
  function getFilteredDrivers() {
    if (!currentRaceData || !currentRaceData.MRData.RaceTable.Races[0]) return [];
    
    const raceResults = currentRaceData.MRData.RaceTable.Races[0].Results;
    
    if (!searchTerm) return raceResults;
    
    return raceResults.filter(result => 
      result.Driver.givenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.Driver.familyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.Driver.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Toggle dark/light mode
  function toggleTheme() {
    setDarkMode(!darkMode);
    // Update charts when theme changes
    if (currentRaceData) {
      setTimeout(updateCharts, 0);
    }
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className={`mb-6 p-4 rounded-lg shadow-lg flex flex-col md:flex-row justify-between items-center ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center mb-4 md:mb-0">
            <Flag className="w-8 h-8 text-red-500 mr-2" />
            <h1 className="text-2xl font-bold">F1 Race Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <div className="relative">
              <select
                value={selectedRace}
                onChange={(e) => setSelectedRace(e.target.value)}
                className={`pl-3 pr-10 py-2 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
                }`}
              >
                <option value="last">Latest Race</option>
                {races.map((race) => (
                  <option key={race.round} value={race.round}>
                    {race.raceName} - Round {race.round}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </header>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className={`space-y-6 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {/* Race Info */}
                {currentRaceData && currentRaceData.MRData.RaceTable.Races[0] && (
                  <div className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h2 className="text-xl font-bold mb-3 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                      Race Information
                    </h2>
                    <div className="space-y-2">
                      <p className="font-semibold">{currentRaceData.MRData.RaceTable.Races[0].raceName}</p>
                      <p className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1 text-red-500" />
                        {currentRaceData.MRData.RaceTable.Races[0].Circuit.Location.locality}, {currentRaceData.MRData.RaceTable.Races[0].Circuit.Location.country}
                      </p>
                      <p className="text-sm">{currentRaceData.MRData.RaceTable.Races[0].date}</p>
                    </div>
                  </div>
                )}
                
                {/* Driver Search */}
                <div className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <h2 className="text-xl font-bold mb-3 flex items-center">
                    <Search className="w-5 h-5 mr-2 text-blue-500" />
                    Driver Search
                  </h2>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search driver..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full p-2 pl-8 rounded-md ${
                        darkMode 
                          ? 'bg-gray-700 text-white placeholder-gray-400 focus:bg-gray-600' 
                          : 'bg-gray-100 text-gray-900 placeholder-gray-500 focus:bg-white'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                
                {/* Driver Comparison */}
                <div className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <h2 className="text-xl font-bold mb-3 flex items-center">
                    <RefreshCw className="w-5 h-5 mr-2 text-blue-500" />
                    Driver Comparison
                  </h2>
                  
                  {currentRaceData && currentRaceData.MRData.RaceTable.Races[0] && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm mb-1">Driver 1</label>
                        <select
                          value={driver1}
                          onChange={(e) => setDriver1(e.target.value)}
                          className={`w-full p-2 rounded-md ${
                            darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                          <option value="">Select Driver</option>
                          {currentRaceData.MRData.RaceTable.Races[0].Results.map((result) => (
                            <option key={result.Driver.driverId} value={result.Driver.driverId}>
                              {result.Driver.code || result.Driver.familyName}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm mb-1">Driver 2</label>
                        <select
                          value={driver2}
                          onChange={(e) => setDriver2(e.target.value)}
                          className={`w-full p-2 rounded-md ${
                            darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        >
                          <option value="">Select Driver</option>
                          {currentRaceData.MRData.RaceTable.Races[0].Results.map((result) => (
                            <option key={result.Driver.driverId} value={result.Driver.driverId}>
                              {result.Driver.code || result.Driver.familyName}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <button
                        onClick={compareDrivers}
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition duration-200"
                      >
                        Compare
                      </button>
                      
                      {comparisonResult && (
                        <div 
                          className={`mt-4 p-3 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}
                          dangerouslySetInnerHTML={{ __html: comparisonResult }}
                        />
                      )}
                    </div>
                  )}
                </div>
                
                {/* Weather Info */}
                <div className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <h2 className="text-xl font-bold mb-3 flex items-center">
                    <CloudRain className="w-5 h-5 mr-2 text-blue-500" />
                    Weather
                  </h2>
                  <p>{weather}</p>
                </div>
                
                {/* Circuit Records */}
                <div className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <h2 className="text-xl font-bold mb-3 flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-blue-500" />
                    Circuit Records
                  </h2>
                  <ul className="space-y-2">
                    {circuitRecords.map((record, index) => (
                      <li key={index} className="text-sm">{record}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Leaderboard */}
              <div className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                  Race Leaderboard
                </h2>
                
                {currentRaceData && currentRaceData.MRData.RaceTable.Races[0] && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className={darkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                          <th className="px-4 py-2 text-left">Pos</th>
                          <th className="px-4 py-2 text-left">Driver</th>
                          <th className="px-4 py-2 text-left">Team</th>
                          <th className="px-4 py-2 text-left">Time</th>
                          <th className="px-4 py-2 text-left">Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredDrivers().map((result) => (
                          <tr 
                            key={result.position} 
                            className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${
                              parseInt(result.position) <= 3 
                                ? darkMode 
                                  ? 'bg-gray-700' 
                                  : 'bg-yellow-50' 
                                : ''
                            }`}
                          >
                            <td className="px-4 py-2">
                              {parseInt(result.position) <= 3 ? (
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                                  result.position === '1' 
                                    ? 'bg-yellow-500' 
                                    : result.position === '2' 
                                      ? 'bg-gray-300' 
                                      : 'bg-amber-700'
                                } text-white font-bold`}>
                                  {result.position}
                                </span>
                              ) : (
                                result.position
                              )}
                            </td>
                            <td className="px-4 py-2 font-medium">
                              {result.Driver.givenName} {result.Driver.familyName}
                              <span className="ml-2 text-xs text-gray-500">
                                {result.Driver.nationality}
                              </span>
                            </td>
                            <td className="px-4 py-2">{result.Constructor.name}</td>
                            <td className="px-4 py-2">{result.Time?.time || result.status}</td>
                            <td className="px-4 py-2 font-semibold">{result.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lap Times Chart */}
                <div className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <h2 className="text-xl font-bold mb-3 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-500" />
                    Fastest Lap Times
                  </h2>
                  <div className="h-64">
                    <canvas ref={lapTimeCanvasRef}></canvas>
                  </div>
                </div>
                
                {/* Positions Chart */}
                <div className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <h2 className="text-xl font-bold mb-3 flex items-center">
                    <BarChart className="w-5 h-5 mr-2 text-purple-500" />
                    Final Positions
                  </h2>
                  <div className="h-64">
                    <canvas ref={positionCanvasRef}></canvas>
                  </div>
                </div>
                
                {/* Speed Chart */}
                <div className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <h2 className="text-xl font-bold mb-3 flex items-center">
                    <LineChart className="w-5 h-5 mr-2 text-red-500" />
                    Average Speeds
                  </h2>
                  <div className="h-64">
                    <canvas ref={speedCanvasRef}></canvas>
                  </div>
                </div>
                
                {/* Driver Stats */}
                <div className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <h2 className="text-xl font-bold mb-3 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-green-500" />
                    Driver Statistics
                  </h2>
                  
                  {currentRaceData && currentRaceData.MRData.RaceTable.Races[0] && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className={`p-3 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <p className="text-sm text-gray-500">Pole Position</p>
                          <p className="font-bold">
                            {currentRaceData.MRData.RaceTable.Races[0].Results.find(r => r.grid === '1')?.Driver.familyName || 'N/A'}
                          </p>
                        </div>
                        
                        <div className={`p-3 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <p className="text-sm text-gray-500">Fastest Lap</p>
                          <p className="font-bold">
                            {currentRaceData.MRData.RaceTable.Races[0].Results.find(r => r.FastestLap?.rank === '1')?.Driver.familyName || 'N/A'}
                          </p>
                        </div>
                        
                        <div className={`p-3 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <p className="text-sm text-gray-500">Most Positions Gained</p>
                          {(() => {
                            const results = currentRaceData.MRData.RaceTable.Races[0].Results;
                            const positionsGained = results.map(r => ({
                              driver: r.Driver.familyName,
                              gained: parseInt(r.grid) - parseInt(r.position)
                            })).sort((a, b) => b.gained - a.gained);
                            
                            return (
                              <p className="font-bold">
                                {positionsGained[0]?.driver || 'N/A'} (+{positionsGained[0]?.gained || 0})
                              </p>
                            );
                          })()}
                        </div>
                        
                        <div className={`p-3 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <p className="text-sm text-gray-500">DNFs</p>
                          <p className="font-bold">
                            {currentRaceData.MRData.RaceTable.Races[0].Results.filter(r => 
                              r.status !== 'Finished' && !r.status.includes('Lap')
                            ).length}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;