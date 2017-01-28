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
    resolve(url, function (location) {
        if (location.includes("/tracks/")) {
            getInfo(location, function (info) {
                if (!info.streamable) {
                    finished(1, 0);
                }
                else {
                    getStream(info.stream_url, function (stream) {
                        info.stream = stream;
                        followup(info);
                        finished(1, 1);
                    });
                }
            });
        } else if (location.includes("/playlists/")) {
            getInfo(location, function (info) {
                var succ = 0;
                info.tracks.forEach(function (track) {
                    if(track.streamable){
                        getStream(track.stream_url, function (stream) {
                            succ++;
                            info.stream = stream;
                            followup(track);
                            if (succ == info.tracks.length) {
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
    http.get(url, function (res) {
        var body = '';
        res.on('data', function (data) {
            body += data;
        });
        res.once('end', function () {
            followup(JSON.parse(body));
        })
    });
}

function resolve(url, followup) {
    url = url.replace("https","http");
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
