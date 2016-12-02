var Discord = require("discord.js");
var pg = require('pg');
var http = require("http");
var express = require('express');
var app = express();
var path = require('path');
var client = new Discord.Client();

var msglog = [];
var timeoutrape = 1 * 60000; //1 minute
var timeoutedit = 0.5 * 60000; //30 secs
//Refresh ScribbleThis
setInterval(function() { http.request({ host: "scribblethis.herokuapp.com", path: "/" }, function() {}).end(); }, 25 * 60000);
//Refresh kanabot
setInterval(function() { http.request({ host: "kanabot.herokuapp.com", path: "/" }, function() {}).end(); }, 25 * 60000);

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/public/index.html'));
});
app.get('/data', function(req, res) {
    connectAndQuery("SELECT * FROM rape ORDER BY count;",function(rows){
    	res.status(200).json(JSON.parse(JSON.stringify(rows));
    });
});
app.listen(process.env.PORT || 8080);

//Login
login();

//Events
//On Ready
client.on('ready', () => {
    console.log(`Logged in as ${client.user.username}#${client.user.discriminator}`);
});

//On Message
client.on('message', message => {
    if (message.author.bot)
        return;
    try {
        reply(message);
    } catch (error) {
        console.log(error);
    }
});

//On Message Update
client.on('messageUpdate', (oldMessage, newMessage) => {
    if (newMessage.author.bot)
        return;
    if (newMessage.editedAt && oldMessage.cleanContent != newMessage.cleanContent && oldMessage.createdTimestamp - Date.now() <= timeoutedit) {
        msglog.push(oldMessage);
        setTimeout(function() {
            if (removeAfterTimeout(oldMessage)) {
                oldMessage.reply("kam ungeschoren davon! RapeCount -1")
                console.log(oldMessage.cleanContent);
                increment(oldMessage.author.username + "#" + oldMessage.author.discriminator, -1);
            }
        }, timeoutrape);
    }
});

//On Message Delete
client.on('messageDelete', (message) => {
    if (message.author.bot || message.createdTimestamp - Date.now() > timeoutedit)
        return;
    msglog.push(message);
    setTimeout(function() { removeAfterTimeout(message) }, timeoutrape);
});

//On Message Delete Bulk
client.on('messageDeleteBulk', (messages) => {
    if (messages.array().length < 5) {
        messages.array().forEach(function(element) {
            if (!element.author.bot && element.createdTimestamp - Date.now() <= timeoutedit) {
                msglog.push(element);
                setTimeout(function() { removeAfterTimeout(element) }, timeoutrape);
            }
        });
    }
});

//Functions
//Logic
function reply(msg) {
    if (msg.isMentioned(client.user)) {
        var cleanmsg = clearMentions(msg.content);
        if (cleanmsg == 'gheat' || cleanmsg == 'gseng') {
            if (rape(msg.channel.name, msg.guild.name) == false) {
                msg.reply("nix zum seng, host di söba graped");
                increment(msg.author.username + "#" + msg.author.discriminator, 1);
            }
        } else if (cleanmsg.startsWith('rapecount')) {
            msg.mentions.users.array().forEach(function(element) {
                var usr = element.username + "#" + element.discriminator;
                if (usr != "kana#7526") {
                    getCount(usr, msg);
                }
            });
        } else if (msg.author.id == 163651635845922816) {
            devCommands(msg, cleanmsg);
        }
    }
}

function devCommands(msg, cleanmsg) {
    if (cleanmsg == 'log') {
        msg.reply("Message Log\n" + msglog);
    } else if (cleanmsg == 'cm') {
        msglog = [];
    } else if (cleanmsg == 'trc') {
        getRapes(msg);
    } else if (cleanmsg.startsWith('db')) {
        var split = cleanmsg.split("?");
        connectAndQuery(split[1], function(rows) {
            var result = "\n";
            if (rows.length > 0) {
                rows.forEach(function(element) {
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
}

function clearMentions(msg) {
    var tags = msg.match("<@.*?>");
    tags.forEach(function(element) {
        msg = msg.replace(element, "");
    });
    return msg.trim();
}

function removeAfterTimeout(msg) {
    var index = msglog.indexOf(msg);
    if (index != -1) {
        msglog.splice(index, 1);
        return true;
    }
    return false;
}

function rape(channel, guild) {
    var replied = false;
    for (var i = 0; i < msglog.length; i++) {
        if (msglog[i].channel.name == channel && msglog[i].guild.name == guild) {
            msglog[i].reply(msglog[i].cleanContent);
            increment(msglog[i].author.username + "#" + msglog[i].author.discriminator, 1);
            replied = true;
            msglog.splice(i, 1);
            i--;
        }
    }
    return replied;
}

//Database Logic
function login() {
    connectAndQuery("SELECT * FROM token", function(rows) {
        client.login(rows[0].tkn);
    });
}

function increment(name, value) {
    connectAndQuery("SELECT * FROM rape WHERE name = '" + name + "';", function(rows, client) {
        if (rows.length == 0) {
            executeQuery("INSERT INTO rape (name,count) VALUES('" + name + "'," + value + ");", client, function(rows) {
                console.log("Inserted " + name);
            });
        } else {
            executeQuery("UPDATE rape SET count = count+" + value + " WHERE name = '" + name + "';", client, function(rows) {
                console.log("Updated " + name);
            });
        }
    });
}

function getCount(usr, msg) {
    connectAndQuery("SELECT * FROM rape WHERE name = '" + usr + "';", function(rows) {
        msg.reply("RapeCount of " + usr + ": " + rows[0].count);
    });
}

function getRapes(msg) {
    connectAndQuery("SELECT * FROM rape ORDER BY count;", function(rows) {
        var table = "\nUsername | RapeCount\n";
        rows.forEach(function(element) {
            table += element.name + " | " + element.count + "\n";
        });
        msg.reply(table);
    });
}

//Database access
function connectAndQuery(query, followup) {
    pg.defaults.ssl = true;
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        if (err) console.log(err);
        else {
            client.query(query, function(err, result) {
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
    client.query(query, function(err, result) {
        if (err) console.log(err);
        else {
            followup(result.rows);
        }
    });
}
