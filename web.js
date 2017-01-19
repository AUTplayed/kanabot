//External dependencies
var http = require("http");
var https = require("https");
var express = require('express');
var app = express();
var path = require('path');

//Internal dependencies
var db = require('./db.js');
var music = require('./music.js');

//Declarations
const MINUTE = 60000;

//Module Exports
module.exports.start = start;

function start() {
    //Refresh ScribbleThis
    setInterval(function () {
        http.request({
            host: "scribblethis.herokuapp.com",
            path: "/refresh"
        }, function () { }).end();
    }, 25 * MINUTE);

    setInterval(function () {
        db.connectAndQuery("SELECT * FROM token WHERE name = 'dns'", function (rows) {
            https.request({
                host: "www.duckdns.org",
                path: "/update?domains=kanabot&token=" + rows[0].key
            }, function () { }).end();
        });
    }, 10 * MINUTE);

    app.use(express.static(__dirname + '/public'));
    app.get('/', function (req, res) {
        res.sendFile(path.join(__dirname + '/public/index.html'));
    });
    app.get('/data', function (req, res) {
        db.connectAndQuery("SELECT * FROM rape ORDER BY count DESC,name ASC;", function (rows) {
            res.status(200).json(JSON.stringify(rows));
        });
    });
    app.get('/log', function (req, res) {
        console.log(require('./bot.js').getClient());
        res.send("logged");
    });

    //Music player
    app.get('/music', function (req, res) {
        res.sendFile(path.join(__dirname + '/public/music.html'));
    });
    app.get('/queue', function (req, res) {
        res.status(200).json(JSON.stringify(music.getQueue()));
    });
    app.get('/current', function (req, res) {
        res.status(200).json(JSON.stringify(music.getCurrent()));
    });
    app.get('/progress', function (req, res) {
        res.status(200).send(music.progress());
    });
    app.get('/skip/:index', function (req, res) {
        music.skip(req.params.index, function (output) { res.send(output) });
    });
    app.get('/pause', function (req, res) {
        music.pauseUnpause();
        res.send("pauseUnpause");
    });
    app.get('/paused', function (req, res) {
        res.send(music.paused());
    });
    app.get('/add/:query', function (req, res) {
        var oncepls = false;
        var query = req.params.query.split("%20").join(" ");
        music.add(query, function (output) { if (!oncepls) { res.send(output); oncepls = true; } });
    });
    app.listen(8080);
}
