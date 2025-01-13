import path from 'path'
import express from 'express'
import currentModulePaths from 'current-module-paths'
import { createClient } from 'redis'
import {fetchWikipediaSummary, replaceSpacesWithUnderscores } from './functions.js'
const app = express();
app.set('views', 'views')
app.set('view engine', 'ejs')

const client = createClient( {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});
client.on('error', (err) => console.log(`Redis Client Error`, err));
client.connect()
const port = 3000

const {__filename, __dirname} = currentModulePaths(import.meta.url);

app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req,res) => {
    res.render('index', {});
})

app.get('/submit', (req, res) => {
    const search = req.query.search;
    const query = encodeURIComponent(search);
    fetchWikipediaSummary(client, query, req, res, false);
})

app.get('/api', (req, res) => {
    const search = req.query.search;
    const query = encodeURIComponent(search);
    fetchWikipediaSummary(client, query, req, res, true);
})

app.listen(port, () => {
    console.log(`Server Listening on port ${port}`);
    console.log(`http://127.0.0.1:${port}`);
})