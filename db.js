//External dependencies
var pg = require('pg');

//Module exports
module.exports.login=login;
module.exports.increment=increment;
module.exports.getCount=getCount;
module.exports.devDatabase=devDatabase;
module.exports.connectAndQuery=connectAndQuery;

function login(client) {
    connectAndQuery("SELECT * FROM token", function (rows) {
        client.login(rows[0].tkn);
    });
}

function increment(name, value) {
    connectAndQuery("SELECT * FROM rape WHERE name = '" + name + "';", function (rows, client) {
        if (rows.length == 0) {
            executeQuery("INSERT INTO rape (name,count) VALUES('" + name + "'," + value + ");", client, function (rows) {
                console.log("Inserted " + name);
            });
        } else {
            executeQuery("UPDATE rape SET count = count+" + value + " WHERE name = '" + name + "';", client, function (rows) {
                console.log("Updated " + name);
            });
        }
    });
}

function getCount(usr, msg) {
    connectAndQuery("SELECT * FROM rape WHERE name = '" + getIdentifier(usr) + "';", function (rows) {
        try {
            msg.reply("RapeCount of " + usr.toString() + ": " + rows[0].count);
        } catch (e) {
            msg.reply("Du bist nu ned graped worn");
        }
    });

}

function devDatabase(query, msg) {
    connectAndQuery(query, function (rows) {
        var result = "\n";
        if (rows.length > 0) {
            rows.forEach(function (element) {
                for (var key in element) {
                    if (element.hasOwnProperty(key)) {
                        result += key + ": " + element[key] + "\n";
                    }
                }
                result += "\n";
            });
            msg.reply(result);
        }
    });
}

//Database access
function connectAndQuery(query, followup) {
    pg.connect("postgres://pi@localhost:5432/pi", function (err, client, done) {
        if (err) console.log(err);
        else {
            client.query(query, function (err, result) {
                if (err) console.log(err);
                else {
                    followup(result.rows, client);
                }
            });
        }
        done();
    });
}

function executeQuery(query, client, followup) {
    client.query(query, function (err, result) {
        if (err) console.log(err);
        else {
            followup(result.rows);
        }
    });
}

function getIdentifier(author) {
    return author.username + "#" + author.discriminator;
}