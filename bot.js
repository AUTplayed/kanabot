//External dependencies
var Discord = require("discord.js");
var client = new Discord.Client();
var http = require("http");

//Internal dependencies
var db = require('./db.js');
var music = require('./music.js');
var web = require('./web.js')

//Declarations
const DEV = "163651635845922816";
const MINUTE = 60000;
var msglog = [];
var lastpm;
var runmsg = "starting from shutdown";

var timeoutrape = 6 * MINUTE;
var timeoutedit = 0.5 * MINUTE;

//Public Getter - I don't know the conventions of nodejs ;-;
module.exports.getClient = function () { return client; };

//Keep kanabot running forever
setInterval(function () {
    if (!client.token || client.ws.ws._closeReceived) {
        client.destroy();
        db.login(client);
    }
}, 1 * MINUTE);

//Start Website
web.start();
//Login
db.login(client);

//Events
//On Ready
client.on('ready', () => {
    console.log(`Logged in as ` + getIdentifier(client.user));
    getUserById(DEV).sendMessage("I am " + runmsg);
    runmsg = "restarting for no reason";
    client.user.setGame("kanabot.duckdns.org");
});

//On Message
client.on('message', message => {
    if (message.author.bot)
        return;
    if (message.isMentioned(client.user) || message.channel.type == 'dm' || message.content.startsWith("💩 ")) {
        if (message.content.startsWith("💩 ")) {
            message.content = message.content.substring(2, message.content.length);
        }
        if (!reply(message) && message.channel.type == 'dm') {
            getUserById(DEV).sendMessage(message.author.toString() + ": " + message.content);
            lastpm = message.author;
        }
        else if (message.channel.type == 'text' && message.channel.name.startsWith("music")) {
            music.commands(clearMentions(message.content), message);
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
                db.increment(getIdentifier(message.author), -1);
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

/*
//On Message Delete Bulk
client.on('messageDeleteBulk', (messages) => {
    if (messages.array().length == 1) {
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
*/

//Functions
//Logic
function reply(msg) {
    var cleanmsg = clearMentions(msg.content);
    if ((cleanmsg == 'gheat' || cleanmsg == 'gseng') && msg.channel.type == 'text') {
        if (rape(msg.channel.name, msg.guild.name) == false) {
            msg.reply("nix zum seng, host di söba graped");
            db.increment(getIdentifier(msg.author), 1);
        }
    } else if (cleanmsg.startsWith('rapecount')) {
        if (msg.mentions.users.array().length > 1) {
            msg.mentions.users.array().forEach(function (user) {
                if (user != client.user) {
                    db.getCount(user, msg);
                }
            });
        } else {
            db.getCount(msg.author, msg);
        }
    } else if (cleanmsg.startsWith('kapparr ')) {
        var split = cleanmsg.split(' ');
        if (split.length < 2)
            return;
        if (!split[1].startsWith("http")) {
            shorten("http://" + split[1], msg);
        } else {
            shorten(split[1], msg);
        }
    } else if (cleanmsg.startsWith('med ')) {
        if (cleanmsg.length <= 4) {
            return false;
        }
        msg.channel.sendMessage(med(cleanmsg.substring(4, cleanmsg.length)));

    } else if (cleanmsg.startsWith('music ')) {
        var musicComm = cleanmsg.substring(6, cleanmsg.length);
        music.commands(musicComm, msg);
    } else if (cleanmsg == "help" || cleanmsg == "commands") {
        var helpcmd = "";
        helpcmd += "\n**General commands: **\ngheat,gseng\nrapecount [user]\nkapparr <url to shorten>\nmed <message>\n";
        helpcmd += "\n**Music commands: **\n*@kana music before all commands if you are not in a channel named \"music\"*\n";
        helpcmd += "play\nadd <search terms>\npladd <search terms>\nstop\npause\nq,queue\nskip [index]\ncurrent [property] *use property proplist*\ncleanq\nprogress\njump | jumpto <seconds | minutes:seconds>\nvolume [number] *default is 1, 2 for example is double*\ndisconnect\n";
        helpcmd += "\n**Website**\nhttp://kanabot.duckdns.org \nhttp://kanabot.duckdns.org/music \n";
        msg.reply(helpcmd);
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
        db.devDatabase(split[1], msg);
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
            db.increment(getIdentifier(msglog[i].author), 1);
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

function med(nomed) {
    var med = "**";
    for (var i = 0; i < nomed.length; i++) {
        med += nomed[i].toUpperCase() + " ";
    }
    return med+"**";
}