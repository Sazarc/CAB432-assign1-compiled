var express = require('express');
const axios = require('axios');
var router = express.Router();
const cache = require('memory-cache');

/* GET home page. */
router.get('/', function(req, res, next) {
    //If season query isn't provided respond 400
    if(!req.query.season){
        res.status(400).json({message: "No season is defined"})
    }

    let season = req.query.season;
    let url = "http://ergast.com/api/f1/" + season + ".json?limit=1";

    // Check if a cache is available
    let cached = cache.get(season);
    if(cached){
        console.log("we have cache")
        res.locals.ret = cached;
        next();
    }

    // If not, get new data:
    else{
        axios.get(url)
            .then(async (response) => {
                const rsp = response.data;
                try{
                    //json data to respond to request
                    let data = await getSeasonResults(season, parseInt(rsp.MRData.total));
                    // cache response for 30 mins
                    cache.put(season, data, 1800000);
                    // store in local response for next to respond
                    res.locals.ret = data;
                    next();
                }
                catch (e) {
                    console.log(e);
                }

            })
            .catch((error) => {
                res.render('error', {error})
            });
    }
});

// Next to respond to request
router.get('/', function (req, res) {
    res.status(200).json(res.locals.ret);
});

//getResults of the season
async function getSeasonResults(season, length) {
    let jason = {season: season, length: length, results: []};
    let results = [];
    for (let x = 1; x <= length; x++) {
        try{
            results.push(getRoundDetails(season, x));
        }
        catch (e) {
            console.log("round fault")
        }
    }
    //await for all promises to be complete before returning
    return Promise.all(results).then((values) => {
        //console.log(values);
        jason.results = values;
        return jason;
    });
}

// get the details of each round
async function getRoundDetails(season, x){
    let complete = false;
    let url = "http://ergast.com/api/f1/" + season + "/" + x + "/results.json?limit=3";
    let raceData = await axios.get(url)
        .then(async (response) => {
            const rsp = response.data;
            if(parseInt(rsp.MRData.total) !== 0){
                complete = true;
                return rsp.MRData.RaceTable.Races[0];
            }
            else{
                return await axios.get("http://ergast.com/api/f1/" + season + "/" + x + ".json").then((response) =>{
                    const rsp = response.data;
                    return rsp.MRData.RaceTable.Races[0];
                }).catch((error) => {
                    console.log("WHOOOPS")
                });
            }
        })
        .catch((error) => { });

    let data = {
        round: x,
        raceName: raceData.raceName,
        dateTime: raceData.date + "T" + raceData.time,
        complete: complete,
        circuit: raceData.Circuit.circuitName,
        locality: raceData.Circuit.Location.locality,
        country: raceData.Circuit.Location.country,
        marker: {
            round: x,
            latlng: [raceData.Circuit.Location.lat, raceData.Circuit.Location.long],
            raceName: raceData.raceName,
        }
    };
    if(complete){
        try{
            data.top3 = await getRoundResults(raceData.Results);
        }
        catch (e) {
            data.top3 = undefined;
        }
    }
    return data;
}

// get the results of the round with driver flags
async function getRoundResults(results){
    let flags = [];
    for(let i = 0; i < 3; i++){
        flags.push(getFlag(results[i].Driver.nationality));
    }
    return Promise.all(flags)
        .then((values) => {
            let arr = [];
            for(let i = 0; i < values.length; i++){
                arr.push({
                    number: results[i].number,
                    position: results[i].position,
                    givenName: results[i].Driver.givenName,
                    familyName: results[i].Driver.familyName,
                    nationality: results[i].Driver.nationality,
                    flag: values[i]
                });
            }
            return arr;
    });
}

// get the flag link based on nationality
function getFlag(nationality){
    let url;
    if(nationality.toLowerCase() === 'dutch'){
        url = "https://restcountries.eu/rest/v2/name/netherlands?fields=flag";
    }
    else if(nationality.toLowerCase() === 'argentine'){
        url = "https://restcountries.eu/rest/v2/name/argentina?fields=flag";
    }
    else{
        url = "https://restcountries.eu/rest/v2/demonym/"+nationality+"?fields=flag";
    }

    let cached = cache.get(nationality.toLowerCase());

    if(cached){
        return cached;
    }
    else{
        return axios.get(url).then((response) => {
            cache.put(nationality.toLowerCase(), response.data[0].flag, 180000000);
            return response.data[0].flag
        }).catch((e) => {console.log("Flag not found")});
    }
}

module.exports = router;