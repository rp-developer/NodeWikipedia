import path from 'path'
import express from 'express'
import fetch from 'node-fetch'
import currentModulePaths from 'current-module-paths'
import { createClient } from 'redis'
const app = express();
app.set('views', 'views')
app.set('view engine', 'ejs')

const client = createClient();
client.on('error', (err) => console.log(`Redis Client Error`, err));
client.connect()
const port = 3000

const {__filename, __dirname} = currentModulePaths(import.meta.url);


async function fetchWikipediaSummary(query, req, res) {
    try {
        let cachedSummary;
        try {
            cachedSummary = await client.get(query);

        } catch (err) {
            console.error('Error fetching from Redis:', redisError);
            res.status(500).send('Error connecting to Redis');
            return; 
        }
            if (cachedSummary) {
                const parsedSummary = JSON.parse(cachedSummary);
                console.log("Serving from Cache");
                res.status(200).render('summary', {extract: parsedSummary.extract, title: parsedSummary.title});
            } else {
                try {
                    const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${query}&prop=extracts&exintro=true&explaintext=true`);
                    const data = await response.json();
                        const pages = data.query.pages;
                        const pageId = Object.keys(pages)[0];


                        if (pageId === "-1") {
                            //Page not found
                            console.log('Page not found');
                            res.status(404).send('Page not found');
                            return;
                        }
                        const title = pages[pageId]['title']
                        const extract = pages[pageId].extract;

                        if (extract) {
                            console.log("Summary: ", extract);
                            
                            const summaryData = {
                                extract, title
                            };
                            client.setEx(query, 3600, JSON.stringify(summaryData), (err) => {
                                if (err) {
                                    console.error(`Error setting cache: ${err}`);
                                } else {
                                    console.log(`Cached Summary in Redis`);
                                }
                            });
                            res.status(200).render('summary', {extract: extract, title: title})
                        } else {
                            console.log('page not found');
                            res.status(404).send("Extract not found");
                        } 
                } catch (error) {
                        console.error("error fetching data:", error);
                        res.status(500).send("Error fetching data")
                }
            }
    } catch (err) {
        console.log(`error fetching data ${err}`);
        res.status(500).send('error fetching data');
    }
    
    
    
    
    
}

app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req,res) => {
    res.render('index', {});
})
app.get('/submit', (req, res) => {
    const name = req.query.search;
    const query = encodeURIComponent(name);
    fetchWikipediaSummary(query, req, res)

})
app.listen(port, () => {
    console.log(`Server Listening on port ${port}`);
})