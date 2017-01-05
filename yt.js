//External dependencies
var https = require("https");
var ytdl = require('ytdl-core');

//Module exports
module.exports.get = get;

function get(urlOrQuery, followup) {
    var url = [];
    if (urlOrQuery.startsWith("https://www.youtube.com")) {
        url.push(urlOrQuery);
        downloadInfos(url, function (infos) {
            followup(infos);
        });
    } else {
        getHtml(getSearchUrl(urlOrQuery), function (html) {
            var pattern = /<a href=\"\/watch\?v=.*?\"/g;
            var matches = html.match(pattern);
            if (!matches || matches.length < 1)
                followup(undefined);
            else {
                matches = matches[0].split("\"")[1];
                if (!matches.includes(";list=")) {
                    url.push(matches);
                    downloadInfos(url, function (infos) {
                        followup(infos);
                    });
                }
                else {
                    var split = matches.split(";")[1];
                    getHtml("https://www.youtube.com/playlist?" + split, function (html2) {
                        pattern = /<a.*href=\"\/watch\?v=.*?;index=.*?"/g;
                        matches = html2.match(pattern);
                        if (!matches || matches.length < 1)
                            followup(undefined);
                        else {
                            matches.forEach(function (e) {
                                e = e.split("href=\"")[1];
                                e = e.split(";")[0];
                                if (!url.includes(e))
                                    url.push(e);
                            });
                            downloadInfos(url, function (infos) {
                                followup(infos);
                            });
                        }
                    });
                }
            }
        });
    }



}

function getSearchUrl(query) {
    query = query.replace(/%/g, "%25");
    query = query.replace(/ /g, "+");
    for (var i in query) {
        if (query[i].charCodeAt() < 48 && query[i] != "+" && query[i] != "%") {
            query = query.replace(query[i], "%" + query[i].charCodeAt().toString(16));
        }
    }
    return "https://www.youtube.com/results?search_query=" + query;
}

function getHtml(url, followup) {
    https.get(url, function (res) {
        var html = '';
        res.on('data', function (data) {
            html += data;
        });
        res.once('end', function () {
            followup(html);
        })
    }).end();
}

function downloadInfo(url, failcount, followup) {
    ytdl.getInfo(url, function (err, info) {
        if (!info || err) {
            console.log(err);
            failcount++;
            if (failcount > 3)
                followup(undefined);
            else
                downloadInfo(url, failcount, function () { followup(); });
        } else {
            followup(info);
        }
    });
}

function downloadInfos(url, followup) {
    var infos = [];
    url.forEach(function (video, index) {
        downloadInfo(video, 0, function (info) {
            infos.push(info);
            if (infos.length == url.length) {
                followup(infos);
            }
        });
    });
}