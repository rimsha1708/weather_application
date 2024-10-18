const api = {
    key: "6f3fd2e821199b2d4fa3fc0bd35365cf", // Your OpenWeatherMap API key
    base: "https://api.openweathermap.org/data/2.5/",
    geoBase: "http://api.openweathermap.org/geo/1.0/"
};

let forecastData = [];
let filteredData = []; // A separate array for filtering/sorting
let originalData = []; // Keep a copy of the original fetched data
let tempUnit = "metric"; // Default to Celsius (metric)
let currentLat, currentLon; // Variables to store current latitude and longitude

let currentPage = 1;
const itemsPerPage = 5; // Show 5 items per page

// Get user's current location and fetch weather data based on geolocation
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                getWeatherData(latitude, longitude);
            },
            (error) => {
                console.error("Error getting geolocation:", error);
                alert("Geolocation not available or permission denied. Please enter a city.");
            }
        );
    } else {
        alert("Geolocation not supported by your browser.");
    }
}

// Fetch coordinates for the city using OpenWeatherMap API
function getCityCoordinates(city) {
    showLoadingSpinner(); // Show loading spinner
    fetch(`${api.geoBase}direct?q=${city}&limit=1&appid=${api.key}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const { lat, lon } = data[0];
                getWeatherData(lat, lon);
            } else {
                alert("City not found.");
                hideLoadingSpinner(); // Hide loading spinner on error
            }
        })
        .catch(error => {
            console.error(error);
            alert("City not found or an error occurred.");
            hideLoadingSpinner(); // Hide loading spinner on error
        });
}

// Search for a city
function searchCity() {
    const city = document.getElementById('searchCity').value;
    if (city) {
        getCityCoordinates(city);
    } else {
        alert("Please enter a city name.");
    }
}

// Fetch weather data based on latitude and longitude and predict future 10 days
function getWeatherData(lat, lon) {
    currentLat = lat; // Store latitude
    currentLon = lon; // Store longitude
    showLoadingSpinner(); // Show loading spinner

    fetch(`${api.base}forecast?lat=${lat}&lon=${lon}&units=${tempUnit}&appid=${api.key}`)
        .then(response => response.json())
        .then(data => {
            // Extract 5 days data (every day at 12:00)
            forecastData = data.list
                .filter(item => new Date(item.dt_txt).getHours() === 12)
                .slice(0, 5) // First 5 days data
                .map(item => ({
                    date: item.dt_txt.split(" ")[0],
                    temp: item.main.temp,
                    condition: item.weather[0].main
                }));

            // Save the original data for reset purposes
            originalData = [...forecastData];
            filteredData = [...forecastData]; // Initialize with the same data

            // Predict next 10 days data based on past 5 days data
            predictNext10Days();

            displayTable(); // Display the table with combined entries
            hideLoadingSpinner(); // Hide loading spinner once data is loaded
        })
        .catch(error => {
            console.error(error);
            alert("Error fetching weather data.");
            hideLoadingSpinner(); // Hide loading spinner on error
        });
}

// Predict the next 10 days data based on the previous 5 days
function predictNext10Days() {
    const tempChanges = [];
    for (let i = 1; i < forecastData.length; i++) {
        tempChanges.push(forecastData[i].temp - forecastData[i - 1].temp);
    }

    const avgChange = tempChanges.reduce((sum, change) => sum + change, 0) / tempChanges.length;
    let lastTemp = forecastData[forecastData.length - 1].temp;

    // Predict the next 10 days
    for (let i = 1; i <= 10; i++) {
        lastTemp += avgChange;
        const predictedCondition = determineCondition(lastTemp); // Determine condition based on temperature
        forecastData.push({
            date: new Date(new Date().setDate(new Date().getDate() + i + 5)).toISOString().split('T')[0],
            temp: lastTemp,
            condition: predictedCondition // Assign condition based on temperature
        });
    }

    filteredData = [...forecastData]; // Set filtered data to include predictions
}

// Determine the weather condition based on the temperature
function determineCondition(temp) {
    if (temp < 18) {
        return "Rain";
    } else if (temp >= 18 && temp <= 22) {
        return "Cloudy";
    } else {
        return "Clear";
    }
}

// Display weather data in table format with pagination
function displayTable() {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ''; // Clear the table content before rendering new rows

    // Calculate start and end indices for the current page
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    // Slice the filtered data to display only the current page's items
    const paginatedData = filteredData.slice(start, end);

    // Add rows to the table for each data item in the current page
    paginatedData.forEach(data => {
        const row = `<tr class="fade-in">
            <td>${data.date}</td>
            <td>${Math.round(data.temp)} ${tempUnit === "metric" ? "°C" : "°F"}</td>
            <td>${data.condition}</td>
        </tr>`;
        tableBody.innerHTML += row;
    });

    updatePaginationControls(); // Update pagination buttons visibility
}

// Function to move to the next page
function nextPage() {
    if (currentPage * itemsPerPage < filteredData.length) {
        currentPage++;
        displayTable(); // Refresh the table with the new page
    }
}

// Function to move to the previous page
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayTable(); // Refresh the table with the new page
    }
}

// Update pagination buttons (enable/disable depending on the current page)
function updatePaginationControls() {
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');

    // Disable 'Previous' if we're on the first page
    if (currentPage === 1) {
        prevButton.disabled = true;
    } else {
        prevButton.disabled = false;
    }

    // Disable 'Next' if we're on the last page
    if (currentPage * itemsPerPage >= filteredData.length) {
        nextButton.disabled = true;
    } else {
        nextButton.disabled = false;
    }
}

// Show loading spinner
function showLoadingSpinner() {
    document.getElementById('spinner').style.display = 'block';
}

// Hide loading spinner
function hideLoadingSpinner() {
    document.getElementById('spinner').style.display = 'none';
}

// Toggle between Celsius and Fahrenheit
function toggleTemperatureUnit() {
    tempUnit = tempUnit === "metric" ? "imperial" : "metric"; // Toggle unit
    if (currentLat && currentLon) {
        getWeatherData(currentLat, currentLon); // Refetch weather data with new unit
    } else {
        alert("Unable to fetch weather data. Please try again.");
    }
}

// Sort temperatures in ascending order
function sortAscending() {
    filteredData.sort((a, b) => a.temp - b.temp);
    displayTable(); // Refresh the table with sorted data
}

// Sort temperatures in descending order
function sortDescending() {
    filteredData.sort((a, b) => b.temp - a.temp);
    displayTable(); // Refresh the table with sorted data
}

// Filter to show only rainy days
function filterRain() {
    filteredData = forecastData.filter(item => item.condition.toLowerCase().includes('rain'));
    displayTable(); // Refresh the table with filtered data
}

// Show the day with the highest temperature
function showHighestTemperature() {
    const highestTempDay = forecastData.reduce((max, item) => item.temp > max.temp ? item : max, forecastData[0]);
    filteredData = [highestTempDay]; // Show only the highest temp day
    displayTable(); // Refresh the table with filtered data
}

// Reset back to original data
function resetData() {
    filteredData = [...forecastData]; // Restore the original data
    displayTable(); // Refresh the table with original data
}
