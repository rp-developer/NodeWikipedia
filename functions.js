import fetch from 'node-fetch';

async function fetchWikipediaSummary(client, query, req, res, asJson) {
    try {
        let cachedSummary;
        try {
            cachedSummary = await client.get(query);

        } catch (redisError) {
            console.error('Error fetching from Redis:', redisError);
            res.status(500).send('Error connecting to Redis');
            return; 
        }
            if (cachedSummary) {
                const parsedSummary = JSON.parse(cachedSummary);
                console.log("Serving from Cache");
                if (asJson === true) {
                    res.status(200).json({extract: parsedSummary.extract, title: parsedSummary.title, page: parsedSummary.page});
                }
                res.status(200).render('summary', {extract: parsedSummary.extract, title: parsedSummary.title, page: parsedSummary.page});
            } else {
                try {
                    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${replaceSpacesWithUnderscores(query)}`;
                    const response = await fetch(url);
                    console.log(url);
                    const data = await response.json();
                    const type = data['type'];

                        if (type === "https://mediawiki.org/wiki/HyperSwitch/errors/bad_request") {
                            //Page not found
                            console.log('Page not found');
                            res.status(404).send('Page not found');
                            return;
                        }
                        const title = data.title;
                        const extract = data.extract;
                        const page = data.content_urls.desktop.page;

                        if (extract) {
                            console.log("Summary: ", extract);
                            
                            const summaryData = {
                                extract, title, page
                            };
                            client.setEx(query, 3600, JSON.stringify(summaryData), (err) => {
                                if (err) {
                                    console.error(`Error setting cache: ${err}`);
                                } else {
                                    console.log(`Cached Summary in Redis`);
                                }
                            });
                            if (asJson === true) {
                                res.status(200).json({extract: extract, title: title, page: page});
                            } else{
                                res.status(200).render('summary', {extract: extract, title: title, page: page});
                            }
                        } else {
                            console.log('page not found');
                            res.status(404).send("page not found");
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




const replaceSpacesWithUnderscores = (query) => {
    return query.replace(/ /g, '_');
};


export {fetchWikipediaSummary, replaceSpacesWithUnderscores};