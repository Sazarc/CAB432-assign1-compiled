var express = require('express');
var router = express.Router();
const axios = require('axios');
const cache = require('memory-cache');

/* GET users listing. */
router.get('/', async function(req, res, next) {
    // check for cache
    let cached = cache.get('seasons');
    if(cached){
        res.status(200).json(cached);
    }
    // else get new data
    else {
        res.status(200).json(await axios.get("http://ergast.com/api/f1/seasons.json?limit=200")
            .then((response) => {
                const rsp = response.data.MRData.SeasonTable.Seasons;
                const ret = {seasons: []};
                for (let x = 0; x < rsp.length; x++) {
                    ret.seasons.push(parseInt(rsp[x].season));
                }
                // reverse order the season, latest season first
                ret.seasons.reverse();
                // put into cache
                cache.put('seasons', ret, 1800000);
                return ret;
        }))
    }
});

module.exports = router;
