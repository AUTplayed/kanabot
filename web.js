var http = require("http");
var express = require('express');
var app = express();
var path = require('path');
var db = require('./db.js');

const MINUTE = 60000;

module.exports = {
	start: function() {
		start();
	}
}
function start(){
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

    app.use(express.static(__dirname + '/public'));
    app.get('/', function (req, res) {
        res.sendFile(path.join(__dirname + '/public/index.html'));
    });
    app.get('/data', function (req, res) {
        db.connectAndQuery("SELECT * FROM rape ORDER BY count DESC,name ASC;", function (rows) {
            res.status(200).json(JSON.stringify(rows));
        });
    });
    app.listen(process.env.PORT || 8080);
}
