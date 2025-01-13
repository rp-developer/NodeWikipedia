const path = require('path');
const express = require('express');
const currentModulePaths = require('current-module-paths');
const { createClient } = require('redis');
const { fetchWikipediaSummary, replaceSpacesWithUnderscores } = require('./functions.js'); // Adjust as needed

const app = express();
app.set('views', 'views');
app.set('view engine', 'ejs');

// Initialize Redis client
const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});
client.on('error', (err) => console.log(`Redis Client Error`, err));
client.connect();


app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index', {});
});

app.get('/submit', (req, res) => {
    const search = req.query.search;
    const query = encodeURIComponent(search);
    fetchWikipediaSummary(client, query, req, res, false);
});

app.get('/api', (req, res) => {
    const search = req.query.search;
    const query = encodeURIComponent(search);
    fetchWikipediaSummary(client, query, req, res, true);
});

// Export the app for Vercel to use in serverless function
module.exports = (req, res) => {
    app(req, res);
};
