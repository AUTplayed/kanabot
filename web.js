//External dependencies
var http = require("http");
var express = require('express');
var app = express();
var path = require('path');

//Internal dependencies
var db = require('./db.js');

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
    //Refresh kanabot
    setInterval(function () {
        http.request({
            host: "kanabot.herokuapp.com",
            path: "/data"
        }, function () { }).end();
    }, 25 * MINUTE);

    //Import of bot
    var bot = require('./bot.js');

    app.use(express.static(__dirname + '/public'));
    app.get('/', function (req, res) {
        res.sendFile(path.join(__dirname + '/public/index.html'));
    });
    app.get('/data', function (req, res) {
        db.connectAndQuery("SELECT * FROM rape ORDER BY count DESC,name ASC;", function (rows) {
            res.status(200).json(JSON.stringify(rows));
        });
    });
    app.get('/wakemeup', function (req, res) {
        db.login(bot.getClient());
        res.status(200);
        res.send("WAKE ME UP INSIDE");
    });
    app.get('/log', function (req, res) {
        console.log(bot.getClient());
        res.status(200);
        res.send("logged");
    });
    app.listen(process.env.PORT || 8080);
}