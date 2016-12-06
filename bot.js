var Discord = require("discord.js");
var pg = require('pg');
var http = require("http");
var express = require('express');
var app = express();
var path = require('path');
var client = new Discord.Client();

const dev = "163651635845922816";
const MINUTE = 60000;
var msglog = [];
var timeoutrape = 6 * MINUTE;
var timeoutedit = 0.5 * MINUTE;
//Refresh ScribbleThis
setInterval(function() { http.request({ host: "scribblethis.herokuapp.com", path: "/refresh" }, function() {}).end(); }, 25 * MINUTE);
//Refresh kanabot
setInterval(function() { http.request({ host: "kanabot.herokuapp.com", path: "/refresh" }, function() {}).end(); }, 25 * MINUTE);

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/public/index.html'));
});
app.get('/data', function(req, res) {
    connectAndQuery("SELECT * FROM rape ORDER BY count DESC;", function(rows) {
        res.status(200).json(JSON.stringify(rows));
    });
});
app.listen(process.env.PORT || 8080);

//Login
login();

//Events
//On Ready
client.on('ready', () => {
    console.log(`Logged in as ` + getIdentifier(client.user));
    client.users.get(dev).sendMessage("I am up and running!");
    client.user.setGame("https://kanabot.herokuapp.com/");
});

//On Message
client.on('message', message => {
    if (message.author.bot)
        return;
    if (message.isMentioned(client.user) || message.channel.type == 'dm') {
        reply(message);
    }
});

//On Message Update
client.on('messageUpdate', (message, newMessage) => {
    if (newMessage.author.bot)
        return;
    if (newMessage.editedAt && message.cleanContent != newMessage.cleanContent && Date.now() - message.createdTimestamp <= timeoutedit && message.channel.type == 'text') {
        msglog.push(message);
        setTimeout(function() {
            if (removeAfterTimeout(message)) {
                message.reply("kam ungeschoren davon! RapeCount -1")
                console.log(message.cleanContent);
                increment(getIdentifier(message.author), -1);
            }
        }, timeoutrape);
    }
});

//On Message Delete
client.on('messageDelete', (message) => {
    if (message.author.bot || Date.now() - message.createdTimestamp > timeoutedit)
        return;
    msglog.push(message);
    setTimeout(function() { removeAfterTimeout(message) }, timeoutrape);
});

//On Message Delete Bulk
client.on('messageDeleteBulk', (messages) => {
    if (messages.array().length < 5) {
        messages.array().forEach(function(message) {
            if (!message.author.bot && Date.now() - message.createdTimestamp <= timeoutedit) {
                msglog.push(message);
                setTimeout(function() { removeAfterTimeout(message) }, timeoutrape);
            }
        });
    }
});

//Functions
//Logic
function reply(msg) {
    var cleanmsg = clearMentions(msg.content);
    if (cleanmsg == 'gheat' || cleanmsg == 'gseng') {
        if (rape(msg.channel.name, msg.guild.name) == false) {
            msg.reply("nix zum seng, host di söba graped");
            increment(getIdentifier(msg.author), 1);
        }
    } else if (cleanmsg.startsWith('rapecount')) {
        if (msg.mentions.users.array().length > 1) {
            msg.mentions.users.array().forEach(function(user) {
                if (user != client.user) {
                    getCount(getIdentifier(user), msg);
                }
            });
        } else {
            getCount(getIdentifier(msg.author), msg);
        }
    } else if (cleanmsg.startsWith('kapparr')) {
        var split = cleanmsg.split(' ');
        if(!split[1].startsWith("http")){
            shorten("http://"+split[1],msg);
        }
        else{
            shorten(split[1],msg);
        }
    } else if (msg.author.id == dev) {
        devCommands(msg, cleanmsg);
    }
}

function devCommands(msg, cleanmsg) {
    if (cleanmsg == 'log') {
        msg.reply("Message Log\n" + msglog);
    } else if (cleanmsg == 'cm') {
        msglog = [];
    } else if (cleanmsg.startsWith('db')) {
        var split = cleanmsg.split("?");
        devDatabase(split[1], msg);
    } else if (cleanmsg.startsWith('ev')) {
        var split = cleanmsg.split("?");
        eval(split[1]);
    }
}

function getIdentifier(author) {
    return author.username + "#" + author.discriminator;
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
            replied = true;
            increment(getIdentifier(msglog[i].author), 1);
            msglog.splice(i, 1);
            i--;
        }
    }
    return replied;
}

function shorten(url,msg) {
    http.request({ host: 'kapparr.ga', path: '/api/'+url }, function(res) {
        res.on('data', function(data) {
            msg.reply(data.toString());
        });
    }).end();
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

function devDatabase(query, msg) {
    connectAndQuery(query, function(rows) {
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
