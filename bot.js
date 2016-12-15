var Discord = require("discord.js");
var pg = require('pg');
var http = require("http");
var https = require("https");
var express = require('express');
var app = express();
var path = require('path');
var yt = require('ytdl-core');
var client = new Discord.Client();

const DEV = "163651635845922816";
const MINUTE = 60000;
var msglog = [];
var lastpm;
var voiceChannel;
var voiceconn;
var player;
var queue = [];
var stopped = false;

var timeoutrape = 6 * MINUTE;
var timeoutedit = 0.5 * MINUTE;
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
        path: "/refresh"
    }, function () { }).end();
}, 25 * MINUTE);

app.use(express.static(__dirname + '/public'));
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/public/index.html'));
});
app.get('/data', function (req, res) {
    connectAndQuery("SELECT * FROM rape ORDER BY count DESC,name ASC;", function (rows) {
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
    getUserById(DEV).sendMessage("I am up and running!");
    client.user.setGame("https://kanabot.herokuapp.com/");
});

//On Message
client.on('message', message => {
    if (message.author.bot)
        return;
    if (message.isMentioned(client.user) || message.channel.type == 'dm') {
        if (!reply(message) && message.channel.type == 'dm') {
            getUserById(DEV).sendMessage(message.author.toString() + ": " + message.content);
            lastpm = message.author;
        }
        else if (message.channel.type == 'text' && message.channel.name.startsWith("music")) {
            music(clearMentions(message.content), message);
        }

    }
});

//On Message Update
client.on('messageUpdate', (message, newMessage) => {
    if (newMessage.author.bot)
        return;
    if (newMessage.editedAt && !message.editedAt && Date.now() - message.createdTimestamp <= timeoutedit && message.channel.type != 'dm') {
        msglog.push(message);
        setTimeout(function () {
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
    setTimeout(function () {
        removeAfterTimeout(message)
    }, timeoutrape);
});

//On Message Delete Bulk
client.on('messageDeleteBulk', (messages) => {
    if (messages.array().length < 5) {
        messages.array().forEach(function (message) {
            if (!message.author.bot && Date.now() - message.createdTimestamp <= timeoutedit) {
                msglog.push(message);
                setTimeout(function () {
                    removeAfterTimeout(message)
                }, timeoutrape);
            }
        });
    }
});

//Functions
//Logic
function reply(msg) {
    var cleanmsg = clearMentions(msg.content);
    if ((cleanmsg == 'gheat' || cleanmsg == 'gseng') && msg.channel.type == 'text') {
        if (rape(msg.channel.name, msg.guild.name) == false) {
            msg.reply("nix zum seng, host di söba graped");
            increment(getIdentifier(msg.author), 1);
        }
    } else if (cleanmsg.startsWith('rapecount')) {
        if (msg.mentions.users.array().length > 1) {
            msg.mentions.users.array().forEach(function (user) {
                if (user != client.user) {
                    getCount(user, msg);
                }
            });
        } else {
            getCount(msg.author, msg);
        }
    } else if (cleanmsg.startsWith('kapparr')) {
        var split = cleanmsg.split(' ');
        if (split.length < 2)
            return;
        if (!split[1].startsWith("http")) {
            shorten("http://" + split[1], msg);
        } else {
            shorten(split[1], msg);
        }
    } else if (cleanmsg.startsWith('yt ')) {
        if (cleanmsg.length < 4)
            return;
        var query = cleanmsg.substring(3, cleanmsg.length);
        youtube(query, function (url) {
            if (!url)
                msg.reply("No video found");
            else
                msg.reply(url)
        });
    } else if (cleanmsg.startsWith('music ')) {
        var musicComm = cleanmsg.substring(6, cleanmsg.length);
        music(musicComm, msg);
    } else if (cleanmsg == "help" || cleanmsg == "commands") {
        msg.reply("Currently available commands: \n@kana gheat,gseng\n@kana rapecount [user]\n@kana kapparr <url to shorten>\n@kana yt <search terms>\n@kana music ...too lazy to fill help");
    } else if (msg.author.id == DEV) {
        devCommands(msg, cleanmsg);
    } else {
        return false;
    }
    return true;
}

function devCommands(msg, cleanmsg) {
    if (cleanmsg == 'log') {
        msg.reply("Message Log\n" + msglog);
    } else if (cleanmsg == 'cm') {
        msglog = [];
    } else if (cleanmsg.startsWith('db')) {
        var split = cleanmsg.split("?");
        devDatabase(split[1], msg);
    } else if (cleanmsg == 'prep') {
        getUserById(DEV).sendMessage("`@kana#7526 ev`\n` ```Javascript `\n`?`\n\n`?`\n` ``` `");
    } else if (msg.cleanContent.startsWith('reply ')) {
        lastpm.sendMessage(msg.cleanContent.substring(6));
    } else if (cleanmsg.startsWith('ev')) {
        var split = cleanmsg.split("?");
        try {
            eval(split[1]);
        } catch (e) {
            console.log(e);
        }
    }
}

function getUserById(id) {
    return client.users.get(id);
}

function getUserByName(name) {
    return client.users.find(u => u.username.startsWith(name));
}

function getIdentifier(author) {
    return author.username + "#" + author.discriminator;
}

function clearMentions(msg) {
    var tags = msg.match("<@.*?>");
    if (!tags)
        return msg.trim();
    tags.forEach(function (element) {
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

function shorten(url, msg) {
    http.request({
        host: 'kapparr.ga',
        path: '/api/' + url
    }, function (res) {
        res.on('data', function (data) {
            if (data.toString().startsWith('<!DOCTYPE html>'))
                msg.reply("error shortening link")
            else
                msg.reply(data.toString());
        });
    }).end();
}

function youtube(query, followup) {
    try {
        query = query.replace(/%/g, "%25");
        query = query.replace(/ /g, "+");
        for (var i in query) {
            if (query[i].charCodeAt() < 48 && query[i] != "+" && query[i] != "%") {
                query = query.replace(query[i], "%" + query[i].charCodeAt().toString(16));
            }
        }
        console.log(query);
    } catch (ex) {
        console.log(ex);
        return;
    }
    https.get("https://www.youtube.com/results?search_query=" + query, function (res) {
        var html = '';
        res.on('data', function (data) {
            html += data;
        });
        res.on('end', function () {
            var pattern = /<a href=\"\/watch\?v=.*?\"/g;
            var matches = html.match(pattern);
            if (!matches || matches.length < 1)
                followup(undefined);
            else {
                matches = matches[0].split("\"");
                matches = matches[1].split("&");
                matches = matches[0];
                console.log(matches);
                followup(matches);
            }
        });
    }).end();

}
function music(cleanmsg, msg) {
    if (cleanmsg.startsWith("play")) {
        play(msg);
    }
    else if (cleanmsg.startsWith("add ")) {
        if (cleanmsg.length < 5)
            return;
        var query = cleanmsg.substring(4, cleanmsg.length);
        add(query, msg);
    }
    else if (cleanmsg.startsWith("stop")) {
        stop(msg);
    }
    else if (cleanmsg.startsWith("queue")) {
        msg.reply("q length: " + queue.length);
    }
}
function add(query, msg) {
    if (!msg.member) {
        msg.reply("Sorry, only in guild chat");
        return;
    }
    youtube(query, function (url) {
        if (!url) {
            msg.reply("No Video found");
        }
        else {
            var stream = yt("https://www.youtube.com" + url, {
                audioonly: true
            });
            queue.push(stream);
        }
    });
}
function play(msg) {
    if (!msg.member) {
        msg.reply("Sorry, only in guild chat");
        return;
    }
    if (!msg.member.voiceChannel) {
        msg.reply("You are not in a voice channel");
        return;
    }
    voiceChannel = msg.member.voiceChannel;
    if (queue.length == 0) {
        msg.reply("Queue is empty");
        return;
    }
    if(voiceChannel){
    	msg.reply("Already playing");
    	return;
    }
    voiceChannel.join().then(connnection => {
        voiceconn = connnection;
        player = connnection.playStream(queue.shift());
        player.on('end', function () {
            if (stopped || queue.length <= 0 || !queue) {
                voiceChannel.leave();
                voiceChannel = undefined;
            } else {
                connnection.playStream(queue.shift());
            }
            stopped = false;
        });
    });
}

function stop(msg) {
    try {
        voiceChannel.leave();
        voiceChannel = undefined;
        player.end();
        stopped = true;
    } catch (ex) {
        msg.reply("No current playback running");
    }
}

//Database Logic
function login() {
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
    pg.defaults.ssl = true;
    pg.connect(process.env.DATABASE_URL, function (err, client, done) {
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