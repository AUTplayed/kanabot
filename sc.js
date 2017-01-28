//External dependencies
var http = require("http");

//Module exports
module.exports.get = get;

//Internal dependencies
var db = require('./db.js');

//Declarations
var token;

db.connectAndQuery("SELECT * FROM token WHERE name = 'sc'", function (rows) {
    token = "client_id=" + rows[0].key;
});

function get(url, followup, finished) {
    redirect(url, function (location) {
        if (location.contains("/tracks/")) {
            getInfo(location, function (info) {
                if (info.streamable) {
                    finished(1, 0);
                }
                else {
                    getStream(location, function (stream) {
                        info.stream = stream;
                        followup(info);
                        finished(1, 1);
                    });
                }
            });
        } else if (location.contains("/playlists/")) {
            getInfo(location, function (info) {
                var count = 0;
                var succ = 0;
                info.tracks.forEach(function (track) {
                    count++;
                    if(track.streamable){
                        getStream(location, function (stream) {
                            succ++;
                            info.stream = stream;
                            followup(info);
                            if (count == info.tracks.length) {
                                finished(succ, info.tracks.length);
                            }
                        });
                    }
                });
            });
        }
    });
}

function getInfo(url, followup) {
    http.get(url + "?" + token, function (res) {
        var body = '';
        res.on('data', function (data) {
            body += data;
        });
        res.once('end', function () {
            followup(JSON.parse(html));
        })
    });
}

function resolve(url, followup) {
    if (!url.startsWith("http://api")) {
        http.get("http://api.soundcloud.com/resolve?url=" + url + "&" + token, function (res) {
            var location = res.headers['location'];
            if (location)
                followup(location.replace("https", "http"));
            else
                followup(url);
        });
    } else {
        followup(url);
    }
}

function getStream(url, followup) {
    redirect(url, function (location) {
        http.get(location, function (res) {
            followup(res);
        }).end();
    });
}

function redirect(url, followup) {
    http.get(url + "?" + token, function (res) {
        var location = res.headers['location'];
        if (location)
            followup(location.replace("https", "http"));
        else
            followup(url);
    }).end();
}
