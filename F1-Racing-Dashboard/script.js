// Global variables
let lapTimeChart, positionChart, speedChart;
let currentRaceData = null;
let isDarkMode = true;

// DOM Elements
const loadingIndicator = document.getElementById('loading-indicator');
const themeToggle = document.getElementById('theme-toggle');
const raceDropdown = document.getElementById('race-dropdown');
const driverSearch = document.getElementById('driver-search');
const driver1Dropdown = document.getElementById('driver1-dropdown');
const driver2Dropdown = document.getElementById('driver2-dropdown');
const compareButton = document.getElementById('compare-button');
const comparisonResult = document.getElementById('comparison-result');

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
  // Set initial theme
  document.body.classList.toggle('dark-mode', isDarkMode);
  
  // Event listeners
  themeToggle.addEventListener('click', toggleTheme);
  raceDropdown.addEventListener('change', handleRaceChange);
  driverSearch.addEventListener('input', filterDrivers);
  compareButton.addEventListener('click', compareDrivers);
  
  // Fetch initial data
  fetchRaces();
  fetchRaceData('last');
});

// Toggle dark/light theme
function toggleTheme() {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode', isDarkMode);
  
  // Update charts with new theme
  if (currentRaceData) {
    setTimeout(updateCharts, 0);
  }
}

// Handle race selection change
function handleRaceChange() {
  const selectedRace = raceDropdown.value;
  fetchRaceData(selectedRace);
}

// Fetch all races for the season
async function fetchRaces() {
  try {
    showLoading(true);
    const response = await fetch("https://ergast.com/api/f1/current.json");
    const data = await response.json();
    populateRaceDropdown(data.MRData.RaceTable.Races);
    showLoading(false);
  } catch (error) {
    console.error("Error fetching races:", error);
    showLoading(false);
  }
}

// Populate race selection dropdown
function populateRaceDropdown(races) {
  // Clear existing options except the default
  while (raceDropdown.options.length > 1) {
    raceDropdown.remove(1);
  }
  
  races.forEach(race => {
    const option = document.createElement("option");
    option.value = race.round;
    option.textContent = `${race.raceName} - Round ${race.round}`;
    raceDropdown.appendChild(option);
  });
}

// Fetch race data for the selected race
async function fetchRaceData(round = "last") {
  try {
    showLoading(true);
    const response = await fetch(`https://ergast.com/api/f1/current/${round}/results.json`);
    currentRaceData = await response.json();
    
    updateRaceInfo();
    updateLeaderboard();
    updateCharts();
    populateDriverDropdowns();
    simulateWeatherData();
    simulateCircuitRecords();
    updateDriverStats();
    
    showLoading(false);
  } catch (error) {
    console.error("Error fetching race data:", error);
    showLoading(false);
  }
}

// Show/hide loading indicator
function showLoading(isLoading) {
  loadingIndicator.style.display = isLoading ? 'flex' : 'none';
}

// Update race information
function updateRaceInfo() {
  if (!currentRaceData || !currentRaceData.MRData.RaceTable.Races[0]) return;
  
  const raceInfo = document.getElementById('race-info');
  const race = currentRaceData.MRData.RaceTable.Races[0];
  
  raceInfo.innerHTML = `
    <p class="font-semibold">${race.raceName}</p>
    <p class="location">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline; margin-right: 4px; color: #ef4444;">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
      ${race.Circuit.Location.locality}, ${race.Circuit.Location.country}
    </p>
    <p class="date">${race.date}</p>
  `;
}

// Update the leaderboard
function updateLeaderboard() {
  if (!currentRaceData || !currentRaceData.MRData.RaceTable.Races[0]) return;
  
  const leaderboardBody = document.getElementById('leaderboard-body');
  leaderboardBody.innerHTML = ''; // Clear existing rows
  
  const raceResults = getFilteredDrivers();
  
  raceResults.forEach(result => {
    const row = document.createElement('tr');
    
    // Position column with special styling for top 3
    const positionCell = document.createElement('td');
    if (parseInt(result.position) <= 3) {
      positionCell.innerHTML = `<span class="position-badge position-${result.position}">${result.position}</span>`;
    } else {
      positionCell.textContent = result.position;
    }
    
    // Driver column with nationality
    const driverCell = document.createElement('td');
    driverCell.innerHTML = `
      <span class="driver-name">${result.Driver.givenName} ${result.Driver.familyName}</span>
      <span class="driver-nationality">${result.Driver.nationality}</span>
    `;
    
    // Team column
    const teamCell = document.createElement('td');
    teamCell.textContent = result.Constructor.name;
    
    // Time/Status column
    const timeCell = document.createElement('td');
    timeCell.textContent = result.Time?.time || result.status;
    
    // Points column
    const pointsCell = document.createElement('td');
    pointsCell.textContent = result.points;
    pointsCell.style.fontWeight = 'bold';
    
    row.appendChild(positionCell);
    row.appendChild(driverCell);
    row.appendChild(teamCell);
    row.appendChild(timeCell);
    row.appendChild(pointsCell);
    
    leaderboardBody.appendChild(row);
  });
}

// Filter drivers based on search term
function filterDrivers() {
  updateLeaderboard();
}

// Get filtered drivers based on search term
function getFilteredDrivers() {
  if (!currentRaceData || !currentRaceData.MRData.RaceTable.Races[0]) return [];
  
  const raceResults = currentRaceData.MRData.RaceTable.Races[0].Results;
  const searchTerm = driverSearch.value.toLowerCase();
  
  if (!searchTerm) return raceResults;
  
  return raceResults.filter(result => 
    result.Driver.givenName.toLowerCase().includes(searchTerm) ||
    result.Driver.familyName.toLowerCase().includes(searchTerm) ||
    (result.Driver.code && result.Driver.code.toLowerCase().includes(searchTerm))
  );
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
  
  // Chart colors based on theme
  const textColor = isDarkMode ? '#f5f5f5' : '#333333';
  const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  
  // Update lap time chart
  if (lapTimeChart) {
    lapTimeChart.destroy();
  }
  
  const lapTimeCtx = document.getElementById('lap-time-chart').getContext('2d');
  lapTimeChart = new Chart(lapTimeCtx, {
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
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: textColor
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
            color: textColor
          },
          grid: {
            color: gridColor
          }
        },
        x: {
          ticks: {
            color: textColor
          },
          grid: {
            color: gridColor
          }
        }
      }
    }
  });
  
  // Update position chart
  if (positionChart) {
    positionChart.destroy();
  }
  
  const positionCtx = document.getElementById('position-chart').getContext('2d');
  positionChart = new Chart(positionCtx, {
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
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: textColor
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
            color: textColor
          },
          grid: {
            color: gridColor
          },
          reverse: true // Lower position numbers are better
        },
        x: {
          ticks: {
            color: textColor
          },
          grid: {
            color: gridColor
          }
        }
      }
    }
  });
  
  // Update speed chart
  if (speedChart) {
    speedChart.destroy();
  }
  
  const speedCtx = document.getElementById('speed-chart').getContext('2d');
  speedChart = new Chart(speedCtx, {
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
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: textColor
          }
        }
      },
      scales: {
        r: {
          angleLines: {
            color: gridColor
          },
          grid: {
            color: gridColor
          },
          pointLabels: {
            color: textColor
          },
          ticks: {
            color: textColor,
            backdropColor: isDarkMode ? '#1e1e1e' : '#f5f5f5'
          }
        }
      }
    }
  });
}

// Populate driver dropdowns for comparison
function populateDriverDropdowns() {
  if (!currentRaceData || !currentRaceData.MRData.RaceTable.Races[0]) return;
  
  const raceResults = currentRaceData.MRData.RaceTable.Races[0].Results;
  
  // Clear existing options except the default
  while (driver1Dropdown.options.length > 1) {
    driver1Dropdown.remove(1);
  }
  
  while (driver2Dropdown.options.length > 1) {
    driver2Dropdown.remove(1);
  }
  
  // Add driver options
  raceResults.forEach(result => {
    const option1 = document.createElement('option');
    option1.value = result.Driver.driverId;
    option1.textContent = result.Driver.code || result.Driver.familyName;
    driver1Dropdown.appendChild(option1);
    
    const option2 = document.createElement('option');
    option2.value = result.Driver.driverId;
    option2.textContent = result.Driver.code || result.Driver.familyName;
    driver2Dropdown.appendChild(option2);
  });
}

// Compare selected drivers
function compareDrivers() {
  if (!currentRaceData || !currentRaceData.MRData.RaceTable.Races[0]) return;
  
  const driver1Id = driver1Dropdown.value;
  const driver2Id = driver2Dropdown.value;
  
  if (!driver1Id || !driver2Id) {
    comparisonResult.innerHTML = '<p>Please select two drivers for comparison.</p>';
    return;
  }
  
  const raceResults = currentRaceData.MRData.RaceTable.Races[0].Results;
  const driver1Data = raceResults.find(result => result.Driver.driverId === driver1Id);
  const driver2Data = raceResults.find(result => result.Driver.driverId === driver2Id);
  
  if (!driver1Data || !driver2Data) {
    comparisonResult.innerHTML = '<p>Driver data not found.</p>';
    return;
  }
  
  const driver1Position = parseInt(driver1Data.position);
  const driver2Position = parseInt(driver2Data.position);
  const positionDiff = Math.abs(driver1Position - driver2Position);
  
  const driver1LapTime = driver1Data.FastestLap?.Time?.time || 'N/A';
  const driver2LapTime = driver2Data.FastestLap?.Time?.time ||  'N/A';
  
  const driver1Speed = driver1Data.FastestLap?.AverageSpeed?.speed || 'N/A';
  const driver2Speed = driver2Data.FastestLap?.AverageSpeed?.speed || 'N/A';
  
  const betterDriver = driver1Position < driver2Position
    ? driver1Data.Driver.givenName + ' ' + driver1Data.Driver.familyName
    : driver2Data.Driver.givenName + ' ' + driver2Data.Driver.familyName;
  
  const isPositionTie = driver1Position === driver2Position;
  
  comparisonResult.innerHTML = `
    <div class="comparison-details">
      <h4 style="font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem;">
        ${driver1Data.Driver.givenName} ${driver1Data.Driver.familyName} vs ${driver2Data.Driver.givenName} ${driver2Data.Driver.familyName}
      </h4>
      
      <div class="comparison-grid">
        <div style="text-align: center;">
          <span style="display: block; font-weight: bold;">${driver1Data.Driver.code}</span>
        </div>
        <div style="text-align: center;">
          <span style="display: block; font-size: 0.875rem;">Comparison</span>
        </div>
        <div style="text-align: center;">
          <span style="display: block; font-weight: bold;">${driver2Data.Driver.code}</span>
        </div>
      </div>
      
      <div class="comparison-grid">
        <div style="text-align: center;">
          <span style="display: block; font-size: 1.5rem; font-weight: bold;">${driver1Position}</span>
          <span style="display: block; font-size: 0.75rem;">Position</span>
        </div>
        <div class="comparison-center">
          <span style="display: block; font-size: 0.875rem;">${positionDiff} pos. diff</span>
        </div>
        <div style="text-align: center;">
          <span style="display: block; font-size: 1.5rem; font-weight: bold;">${driver2Position}</span>
          <span style="display: block; font-size: 0.75rem;">Position</span>
        </div>
      </div>
      
      <div class="comparison-grid">
        <div style="text-align: center;">
          <span style="display: block; font-weight: bold;">${driver1LapTime}</span>
          <span style="display: block; font-size: 0.75rem;">Fastest Lap</span>
        </div>
        <div class="comparison-center">
          <span style="display: block; font-size: 0.875rem;">Lap Time</span>
        </div>
        <div style="text-align: center;">
          <span style="display: block; font-weight: bold;">${driver2LapTime}</span>
          <span style="display: block; font-size: 0.75rem;">Fastest Lap</span>
        </div>
      </div>
      
      <div class="comparison-grid">
        <div style="text-align: center;">
          <span style="display: block; font-weight: bold;">${driver1Speed}</span>
          <span style="display: block; font-size: 0.75rem;">Avg Speed</span>
        </div>
        <div class="comparison-center">
          <span style="display: block; font-size: 0.875rem;">km/h</span>
        </div>
        <div style="text-align: center;">
          <span style="display: block; font-weight: bold;">${driver2Speed}</span>
          <span style="display: block; font-size: 0.75rem;">Avg Speed</span>
        </div>
      </div>
      
      <div class="comparison-result-box ${isPositionTie ? 'result-tie' : 'result-winner'}">
        ${isPositionTie 
          ? "Both drivers are tied based on position." 
          : `${betterDriver} is in a higher position.`}
      </div>
    </div>
  `;
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
  
  const weatherDetails = document.getElementById('weather-details');
  weatherDetails.textContent = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
}

// Simulate circuit records (since the real API isn't available)
function simulateCircuitRecords() {
  if (!currentRaceData || !currentRaceData.MRData.RaceTable.Races[0]) return;
  
  const circuitName = currentRaceData.MRData.RaceTable.Races[0].Circuit.circuitName;
  const records = [
    `Lap Record: 1:21.046 - Lewis Hamilton (2020)`,
    `Pole Position: 1:19.273 - Max Verstappen (2021)`,
    `Most Wins: 8 - Lewis Hamilton`,
    `First Grand Prix: 1950`
  ];
  
  const circuitRecords = document.getElementById('circuit-records');
  circuitRecords.innerHTML = '';
  
  records.forEach(record => {
    const li = document.createElement('li');
    li.textContent = record;
    circuitRecords.appendChild(li);
  });
}

// Update driver statistics
function updateDriverStats() {
  if (!currentRaceData || !currentRaceData.MRData.RaceTable.Races[0]) return;
  
  const driverStats = document.getElementById('driver-stats');
  const raceResults = currentRaceData.MRData.RaceTable.Races[0].Results;
  
  // Find pole position driver (grid = 1)
  const poleDriver = raceResults.find(r => r.grid === '1')?.Driver.familyName || 'N/A';
  
  // Find fastest lap driver
  const fastestLapDriver = raceResults.find(r => r.FastestLap?.rank === '1')?.Driver.familyName || 'N/A';
  
  // Calculate most positions gained
  const positionsGained = raceResults.map(r => ({
    driver: r.Driver.familyName,
    gained: parseInt(r.grid) - parseInt(r.position)
  })).sort((a, b) => b.gained - a.gained);
  
  // Count DNFs
  const dnfCount = raceResults.filter(r => 
    r.status !== 'Finished' && !r.status.includes('Lap')
  ).length;
  
  driverStats.innerHTML = `
    <div class="stat-card">
      <p class="stat-label">Pole Position</p>
      <p class="stat-value">${poleDriver}</p>
    </div>
    
    <div class="stat-card">
      <p class="stat-label">Fastest Lap</p>
      <p class="stat-value">${fastestLapDriver}</p>
    </div>
    
    <div class="stat-card">
      <p class="stat-label">Most Positions Gained</p>
      <p class="stat-value">${positionsGained[0]?.driver || 'N/A'} (+${positionsGained[0]?.gained || 0})</p>
    </div>
    
    <div class="stat-card">
      <p class="stat-label">DNFs</p>
      <p class="stat-value">${dnfCount}</p>
    </div>
  `;
}