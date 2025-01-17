async function fetchWikipediaSummary(client, query, req, res, asJson = false) {
    try {
        const sendResponse = (status, data) => {
            if (asJson) {
                return res.status(status).json(data);
            }
            return res.status(status).render('summary', data);
        };

        // Fetch cached summary
        let cachedSummary;
        try {
            cachedSummary = await client.get(query);
        } catch (redisError) {
            console.error('Error fetching from Redis:', redisError);
            return res.status(500).send('Error connecting to Redis');
        }

        if (cachedSummary) {
            console.log("Serving from Cache");
            const parsedSummary = JSON.parse(cachedSummary);
            return sendResponse(200, { extract: parsedSummary.extract, title: parsedSummary.title, page: parsedSummary.page });
        }

        // Fetch summary from Wikipedia API
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${replaceSpacesWithUnderscores(query)}`;
        console.log("Fetching URL:", url);
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            console.error('Error fetching from Wikipedia API:', response.statusText);
            return res.status(404).send('Page not found');
        }
        const { title, extract, contentUrls } = data;
        const page = contentUrls.desktop.page;

        if (!extract) {
            console.log('Page not found');
            return res.status(404).send('Page not found');
        }

        console.log("Summary:", extract);

        const summaryData = { extract, title, page };
        try {
            await client.set(query, JSON.stringify(summaryData), { EX: 3600 });
            console.log('Cached Summary in Redis');
        } catch (err) {
            console.error('Error caching data in Redis:', err);
        }

        return sendResponse(200, summaryData);
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send('Error fetching data');
    }
}

const replaceSpacesWithUnderscores = (query) => query.replace(/ /g, '_');

export {fetchWikipediaSummary, replaceSpacesWithUnderscores}