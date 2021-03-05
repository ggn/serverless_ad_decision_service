const https = require('https')

module.exports = function(adserver, qs, callback) {
    var data = '',
        url = `${adserver}?${qs}`;
    console.log("URL", url);
    const req = https.get(url, function(res) {
        if (res.statusCode >= 200 && res.statusCode < 400) {
            res.on('data', function(data_) { data += data_.toString(); });
            res.on('end', function() {
                console.log('data', data);
                if (data.indexOf('MediaFile') <= 0) {
                    return callback(false, null);
                }
                callback(true, data);
            });
        }
    });
    req.on('error', error => {
        console.error(error)
        callback(false, null);
    })
}
