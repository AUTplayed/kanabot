//External dependencies
var https = require("https");
var ytdl = require('ytdl-core');

//Internal dependencies
var db = require('./db.js');

//Declarations
var baseurl = "https://www.googleapis.com/youtube/v3/";
var key;
db.connectAndQuery("SELECT * FROM token WHERE name = 'yt'", function (rows) {
    key = rows[0].key;
});

//Module exports
module.exports.get = get;

function get(q, followup, finished) {
    getBody(baseurl + "search?part=snippet&q=" + q + "&type=video,playlist&key=" + key, function(body) {
        if(body.items.length < 1){
            finished(1,0);
            return;
        }
        var id = body.items[0].id;
        if (id.videoId) {
            downloadInfo("https://www.youtube.com/watch?v=" + id.videoId, 0, function(info) {
                followup(info);
                if (finished)
                    finished(1, 1);
            });
        } else {
            var progress = 0;
            var success = 0;
            var length;
            getAllPlaylistElements(id.playlistId, function(len) {
                length = len
            }, function(videoId) {
                console.log(videoId);
                
                downloadInfo("https://www.youtube.com/watch?v="+videoId, 0, function(info) {
                    progress++;
                    followup(info);
                    if (info.title) success++;
                    if (progress == length) {
                        if (finished)
                            finished(length, success);
                    }
                });
            });
        }
    });
}

function getAllPlaylistElements(id, len, followup) {
    getBody(baseurl + "playlistItems?part=snippet&maxResults=50&playlistId=" + id + "&key=" + key, function(body) {
        var iterations = Math.ceil(body.pageInfo.totalResults / 50);
        len(body.pageInfo.totalResults);
        body.items.forEach(function(item) {
            followup(item.snippet.resourceId.videoId);
        });
        if (iterations > 1) {
            recursiveGetElements(id, body.nextPageToken, iterations, followup);
        }
    });
}

function recursiveGetElements(id, pageToken, iterations, followup) {
    getBody(baseurl + "playlistItems?part=snippet&maxResults=50&playlistId=" + id + "&pageToken=" + pageToken + "&key=" + key, function(body) {
        body.items.forEach(function(item) {
            followup(item.snippet.resourceId.videoId);
        });
        if (--iterations > 1) {
            recursiveGetElements(id, body.nextPageToken, iterations, followup);
        }
    });
}

function downloadInfo(url, failcount, followup) {
    ytdl.getInfo(url, function(err, info) {
        if (!info || err) {
            console.log(err);
            failcount++;
            if (failcount > 3)
                followup("Failed to download: " + url + "\nReason: " + err.message);
            else
                downloadInfo(url, failcount, followup);
        } else {
            followup(info);
        }
    });
}

function getBody(url, followup) {
    https.get(url, function(res) {
        var html = '';
        res.on('data', function(data) {
            html += data;
        });
        res.once('end', function() {
            followup(JSON.parse(html));
        })
    }).end();
}