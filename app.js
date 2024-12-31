import path from 'path'
import express from 'express'
import fetch from 'node-fetch'
import currentModulePaths from 'current-module-paths'
import { createClient } from 'redis'
import { fetchWikipediaSummary, replaceSpacesWithUnderscores } from './functions.js'
const app = express();
app.set('views', 'views')
app.set('view engine', 'ejs')

const client = createClient();
client.on('error', (err) => console.log(`Redis Client Error`, err));
client.connect()
const port = 3000

const {__filename, __dirname} = currentModulePaths(import.meta.url);

app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req,res) => {
    res.render('index', {});
})

app.get('/submit', (req, res) => {
    const name = req.query.search;
    const query = encodeURIComponent(name);
    fetchWikipediaSummary(client, query, req, res)

})
app.listen(port, () => {
    console.log(`Server Listening on port ${port}`);
})