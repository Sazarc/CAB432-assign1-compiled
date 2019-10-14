var express = require('express');
const axios = require('axios');
var router = express.Router();
const cache = require('memory-cache');
const redis = require('redis');
const AWS = require('aws-sdk');

const redisClient = redis.createClient();
const bucketName = "BucketName";
const redisTime = 10; // in seconds

/* GET home page. */
router.get('/', function(req, res, next) {
    //If season query isn't provided respond 400
    if(!req.query.season){
        res.status(400).json({message: "No season is defined"})
    }

    let season = req.query.season;
    let url = "http://ergast.com/api/f1/" + season + "/results.json?limit=500";

    let cached = cache.get(season+"data");
    if(cached){
        console.log(cached.MRData.total);
        getSeasonResults(season, cached.MRData.total, cached.MRData.RaceTable.Races).then((seasonResults) => {
            res.locals.ret = seasonResults;
            next();
        })
    }
    else{
        axios.get(url)
            .then(async (response) => {
                const rsp = response.data;
                let seasonData = await axios.get("http://ergast.com/api/f1/" + season + ".json").then((response) =>{
                    return response.data;
                });
                try{
                    // cache response for 30 mins
                    await cache.put(season+'results', rsp, 1800000);
                    await cache.put(season+'data', seasonData, 1800000);
                    //json data to respond to request
                    let data = await getSeasonResults(season, parseInt(seasonData.MRData.total));
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
    let seasonData = cache.get(season+'data');
    let seasonResults = cache.get(season+'results');
    for (let x = 0; x < length; x++) {
        if(x >= seasonResults.MRData.RaceTable.Races.length){
            results.push(getRoundDetails(seasonData.MRData.RaceTable.Races[x], x + 1, false));
        }
        else{
            results.push(getRoundDetails(seasonResults.MRData.RaceTable.Races[x], x + 1, true));
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
async function getRoundDetails(raceData, x, complete){
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
            data.results = await getRoundResults(raceData.Results);
        }
        catch (e) {
            data.results = undefined;
        }
    }
    return data;
}

// get the results of the round with driver flags
async function getRoundResults(results) {
    let flags = [];
    for(let i = 0; i < results.length; i++){
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
    else if(nationality.toLowerCase() === 'indian'){
        return "https://restcountries.eu/data/ind.svg";
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
        }).catch((e) => {console.log("Flag not found, "+nationality)});
    }
}

function checkStorages(key){
    return redisClient.get(key, (err, result) => {
        // If that key exist in Redis store
        if (result) {
            return JSON.parse(result);
        } else { // Key does not exist in Redis store
            // Check S3
            const params = { Bucket: bucketName, Key: key};
            return new AWS.S3({apiVersion: '2006-03-01'}).getObject(params, (err, result) => {
                if (result) {
                    // Serve from S3
                    const resultJSON = JSON.parse(result.Body);
                    redisClient.setex(key, redisTime, JSON.stringify(resultJSON));
                    return resultJSON;
                }
                else {
                    return null;
                }
            });
        }
    });
}

function storeNew(key, toStore){
    const body = JSON.stringify(toStore);
    const objectParams = {Bucket: bucketName, Key: key, Body: body};
    const uploadPromise = new AWS.S3({apiVersion: '2006-03-01'}).putObject(objectParams).promise();
    uploadPromise.then(function(data) {
        console.log("Successfully uploaded data to " + bucketName + "/" + key);
    });
    redisClient.setex(key, redisTime, body);
}

module.exports = router;