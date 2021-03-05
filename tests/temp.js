const https = require('https')
var data = '';
const req = https.get(`https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator=1232`, function(res) {
    if (res.statusCode >= 200 && res.statusCode < 400) {
        res.on('data', function(data_) { data += data_.toString(); });
        res.on('end', function() {
            console.log('data', data);
            console.log('Media Files :', data.indexOf('MediaFile'));
            debugger;
        });
    }
});
req.on('error', error => {
    console.error(error)
})
