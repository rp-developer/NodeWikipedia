import path from 'path'
import express from 'express'
import { createClient } from 'redis';
import {fetchWikipediaSummary} from './functions.js'
import { fileURLToPath } from 'url';
import {dirname} from 'path';
const app = express();
app.set('views', 'views');
app.set('view engine', 'ejs');
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Initialize Redis client
const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});
client.on('error', (err) => console.log(`Redis Client Error`, err));
await client.connect();

const port = 3000;

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

app.listen(port, function(err) {
    console.log(`This app is running on the address http://127.0.0.1:${port}`);
    if (err) {
        console.log(err);
    }
});
