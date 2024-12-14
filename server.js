const express = require('express');
const axios = require('axios');
const mysql = require('mysql2/promise');
const cron = require('node-cron'); // Import cron


const app = express();
const PORT = process.env.PORT || 4000; // Use Render's assigned port or default to 4000
const path = require('path');

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));


// MySQL connection pool
const db = mysql.createPool({ 
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '6432',
    database: process.env.DB_NAME || 'crypto_tracker',
    port: process.env.DB_PORT || 3306
});



// Save price route with database integration
app.get('/api/save-price', async (req, res) => {
    try {
        const coin = req.query.coin || 'bitcoin';
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`;

        const response = await axios.get(url);
        console.log(`Fetched price from CoinGecko for ${coin}:`, response.data[coin]?.usd); // <-- Debug log
        const price = response.data[coin]?.usd;
        
        if (!price) {
            throw new Error(`Price not found for coin: ${coin}`);
        }

        // Insert into the database
        await db.execute(
            'INSERT INTO crypto_prices (coin, price, date) VALUES (?, ?, ?)',
            [coin, price, new Date().toISOString().slice(0, 10)]
        );

        res.json({ message: 'Price saved successfully!', coin, price });
    } catch (error) {
        console.error('Error saving price:', error.message);
        res.status(500).json({ error: 'Unable to save crypto price', details: error.message });
    }
});

//get price route
app.get('/api/get-prices', async (req, res) => {
    try {
        const { coin, date } = req.query;

        let query = 'SELECT * FROM crypto_prices';
        const params = [];

        if (coin) {
            query += ' WHERE coin = ?';
            params.push(coin);
        }

        if (date) {
            if (params.length > 0) query += ' AND date = ?';
            else query += ' WHERE date = ?';
            params.push(date);
        }

        // Adjust the sort order to ascending
        query += ' ORDER BY created_at ASC';

        console.log('Executing query:', query, 'with params:', params);
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error retrieving prices:', error.message);
        res.status(500).json({ error: 'Unable to retrieve prices', details: error.message });
    }
});



// Schedule a cron job to save prices automatically
cron.schedule('*/5 * * * *', async () => {
    console.log('Running scheduled task: Fetching crypto prices...');
    const coins = ['bitcoin', 'ethereum', 'dogecoin', 'solana']; // Add the coins you want to track

    try {
        for (const coin of coins) {
            const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`;

            const response = await axios.get(url);
            const price = response.data[coin]?.usd;

            if (price) {
                await db.execute(
                    'INSERT INTO crypto_prices (coin, price, date) VALUES (?, ?, ?)',
                    [coin, price, new Date().toISOString().slice(0, 10)]
                );
                console.log(`Saved price for ${coin}: $${price}`);
            }
        }
    } catch (error) {
        console.error('Error in scheduled task:', error.message);
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
