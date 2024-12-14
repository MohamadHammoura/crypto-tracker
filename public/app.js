let chart; // Global variable to store the Chart.js instance

// Save price
document.getElementById('save-price-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const coin = document.getElementById('coin').value;

    try {
        const response = await fetch(`/api/save-price?coin=${coin}`);
        const data = await response.json();
        alert(data.message || 'Price saved successfully!');
        document.getElementById('coin').value = ''; // Clear input field
    } catch (error) {
        alert('Failed to save price.');
        console.error(error);
    }
});

// Fetch and display all prices in the table
document.getElementById('fetch-prices').addEventListener('click', async () => {
    await loadTableData(); // Load data into the table
});

// Load chart and table data for a specific coin
async function loadChartData(coin) {
    try {
        const response = await fetch(`/api/get-prices?coin=${coin}`);
        const data = await response.json();

        const labels = data.map(row => new Date(row.created_at).toLocaleString());
        const prices = data.map(row => row.price);

        const ctx = document.getElementById('price-chart').getContext('2d');

        if (chart) chart.destroy(); // Destroy previous chart if it exists

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${coin} Price (USD)`,
                    data: prices,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Price (USD)'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading chart data:', error);
        alert('Failed to load chart data.');
    }
}

// Load data into the table
async function loadTableData(coin = null) {
    try {
        let url = '/api/get-prices';
        if (coin) url += `?coin=${coin}`;

        const response = await fetch(url);
        const data = await response.json();

        const tableBody = document.getElementById('prices-table');
        tableBody.innerHTML = ''; // Clear existing rows

        // Reverse the data to display newest first for the table
        const reversedData = data.reverse();

        reversedData.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.id}</td>
                <td>${row.coin}</td>
                <td>${parseFloat(row.price).toFixed(8)}</td>
                <td>${new Date(row.created_at).toLocaleString()}</td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (error) {
        alert('Failed to load table data.');
        console.error(error);
    }
}


// Load chart and table data when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadChartData('bitcoin');
    loadTableData('bitcoin');
});

// Filter Form Submission
document.getElementById('filter-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const coin = document.getElementById('filter-coin').value;

    if (coin) {
        await loadChartData(coin); // Load chart for filtered coin
        await loadTableData(coin); // Load table for filtered coin
    } else {
        alert('Please enter a coin name to filter the chart.');
    }
});
