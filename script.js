const api = {
    key: "6f3fd2e821199b2d4fa3fc0bd35365cf",
    base: "https://api.openweathermap.org/data/2.5/"
};

const searchbox = document.getElementById('searchCity');
const weatherDataContainer = document.getElementById('weatherData');
const weatherWidget = document.querySelector('.weather-data-section');

searchbox.addEventListener('keypress', function (evt) {
    if (evt.key === "Enter") {
        getResults(searchbox.value);
    }
});

function getResults(query) {
    fetch(`${api.base}weather?q=${query}&units=metric&APPID=${api.key}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('City not found or an error occurred. Please check your input.');
            }
            return response.json();
        })
        .then(currentWeather => {
            displayResults(currentWeather);
            return fetch(`${api.base}forecast?q=${query}&units=metric&APPID=${api.key}`);
        })
        .then(response => response.json())
        .then(forecastWeather => {
            processForecastData(forecastWeather);
        })
        .catch(error => {
            console.error('Error details:', error);
            alert(error.message);
        });
}

function displayResults(weather) {
    const { name, sys, main, weather: weatherArr } = weather;
    const weatherCondition = weatherArr[0].main.toLowerCase();
    weatherDataContainer.innerHTML = `
        <p><strong>City:</strong> ${name}, ${sys.country}</p>
        <p><strong>Temperature:</strong> ${Math.round(main.temp)} °C</p>
        <p><strong>Condition:</strong> ${weatherArr[0].main}</p>
        <p><strong>Humidity:</strong> ${main.humidity}%</p>
    `;
    updateBackground(weatherCondition);
}

function processForecastData(forecast) {
    const dailyData = {};
    const weatherCounts = {};
    let totalDays = 0;

    forecast.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        if (!dailyData[date]) {
            dailyData[date] = {
                temps: [],
                condition: item.weather[0].main
            };
            totalDays++;
        }
        dailyData[date].temps.push(item.main.temp);
        const condition = item.weather[0].main.toLowerCase();
        weatherCounts[condition] = (weatherCounts[condition] || 0) + 1;
    });

    const labels = Object.keys(dailyData).slice(0, 5);
    const temperatures = labels.map(date => average(dailyData[date].temps));
    const weatherConditions = Object.keys(weatherCounts).map(condition => ({
        condition,
        count: weatherCounts[condition]
    }));

    createBarChart(labels, temperatures);
    createDoughnutChart(weatherConditions, totalDays);
    createLineChart(labels, temperatures);
}

function average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function updateBackground(condition) {
    let backgroundImage = '';
    switch (condition) {
        case 'clear':
            backgroundImage = 'url(clear_sky.jpg)';
            break;
        case 'clouds':
            backgroundImage = 'url(cloudy.jpg)';
            break;
        case 'rain':
            backgroundImage = 'url(rainy.jpg)';
            break;
        case 'snow':
            backgroundImage = 'url(snow.jpg)';
            break;
        case 'thunderstorm':
            backgroundImage = 'url(thunderstorm.jpg)';
            break;
        case 'drizzle':
            backgroundImage = 'url(drizzle.jpg)';
            break;
        case 'mist':
        case 'haze':
        case 'fog':
            backgroundImage = 'url(foggy.jpg)';
            break;
        default:
            backgroundImage = 'url(default.jpg)';
            break;
    }
    weatherWidget.style.backgroundImage = backgroundImage;
    weatherWidget.style.backgroundSize = 'cover';
    weatherWidget.style.backgroundPosition = 'center';
}

function createBarChart(labels, temperatures) {
    const ctx = document.getElementById('barChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: temperatures,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutBounce'
            }
        }
    });
}

function createDoughnutChart(weatherConditions, totalDays) {
    const ctx = document.getElementById('doughnutChart').getContext('2d');
    const labels = weatherConditions.map(w => w.condition);
    const data = weatherConditions.map(w => (w.count / totalDays) * 100);
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Weather Conditions',
                data: data,
                backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(255, 206, 86, 0.2)'],
                borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            animation: {
                duration: 2000,
                easing: 'easeInOutBounce'
            }
        }
    });
}

function createLineChart(labels, temperatures) {
    const ctx = document.getElementById('lineChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: temperatures,
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: false
            }]
        },
        options: {
            animation: {
                duration: 1500,
                easing: 'easeOutBounce'
            }
        }
    });
}
