const express = require('express'),
  app = express(),
  fs = require('fs'),
  querystring = require('querystring'),
  requester = require("./ads-request");


//////////////////////////Dummy Code Section////////////////////////
//Dummy functions to mock personilisation and AD Inventory check
//Please implement this section as per your requirement////////////
const MY_AD_INVENTORY = [
  { condition: { geo: "mumbai", gender: "male" }, adfile: "mumbai_male.mp4", adid: "2100" },
  { condition: { geo: "delhi", gender: "male" }, adfile: "delhi_male.mp4", adid: "2101" },
  { condition: { geo: "mumbai", gender: "female" }, adfile: "mumbai_female.mp4", adid: "2102" },
  { condition: { geo: "delhi", gender: "female" }, adfile: "delhi_female.mp4", adid: "2103" }
];

const AD_URL = process.env.AD_URL_S3_BUCKET,
  VAST_URl = process.env.VAST_URL;

var getAdvertisementsfromADS = function(all_querystrings, callback) {
  const vast_host = process.env.VAST_HOST,
    override_ads = parseInt(process.env.OVERRIDE_ADS || '0'); // "1 or 0";
  console.log("override_ads", override_ads);
  if (override_ads <= 0 && vast_host && all_querystrings && all_querystrings.iu) {
    console.log("Making request to ADS");
    var qs = querystring.stringify(all_querystrings)
    requester(vast_host, qs, callback);
  }
  else {
    callback(false, null);
  }
}

var getPersonalisedAd = function(geo, gender) {
  var defaultAdId = new Date().getFullYear().toString() + new Date().getDay().toString() + new Date().getDate().toString();
  var adv = { adfile: "default.mp4", adid: defaultAdId }; //Default ad with daily new adid
  if (!geo || !gender) {
    return adv;
  }
  var matching_ads = MY_AD_INVENTORY.filter(function(ad) {
    if (ad.condition.gender == gender && ad.condition.geo == geo)
      return true;
    return false;
  });
  return matching_ads.length > 0 ? matching_ads[0] : adv;
}
//////////////////////////END of Dummy Code Section////////////////////////

app.get('/live', function(req, res) {
  var gender = req.query.gender;
  var geo = req.query.geo;

  getAdvertisementsfromADS(req.query, function(media_from_ADS, vast_xml) {
    if (media_from_ADS) {
      res.set('Content-Type', 'text/xml');
      return res.send(vast_xml);
    }

    var add = getPersonalisedAd(geo, gender);
    var video_url = AD_URL + add.adfile;
    var contents = fs.readFileSync('./xmls/vast.xml', 'utf8');
    contents = contents.replace("AD_ID", add.adid);
    contents = contents.replace("CREATIVE_ID", add.adid);
    contents = contents.replace("AD_URL", video_url);
    res.set('Content-Type', 'text/xml');
    res.send(contents);
  })
});

app.get('/vod', function(req, res) {
  var contents = fs.readFileSync('./xmls/vmap.xml', 'utf8');
  var querystring = req.originalUrl.split("?")[1];
  var VAST_Url = querystring ? VAST_URl + "?" + querystring : VAST_URl;
  contents = contents.replace("AD_VAST_URL_1", VAST_Url);
  contents = contents.replace("AD_VAST_URL_2", VAST_Url);
  contents = contents.replace("AD_VAST_URL_3", VAST_Url);
  res.set('Content-Type', 'text/xml');
  res.send(contents);
});

// Export your Express configuration so that it can be consumed by the Lambda handler
module.exports = app
