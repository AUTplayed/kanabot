//External dependencies
var Discord = require("discord.js");
var client = new Discord.Client();
var http = require("http");

//Internal dependencies
var db = require('./db.js');
var music = require('./music.js');
var web = require('./web.js');

//Declarations
const DEV = "163651635845922816";
const MINUTE = 60000;
var msglog = [];
var lastpm;
var shutdown = true;

var timeoutrape = 6 * MINUTE;
var timeoutedit = 0.5 * MINUTE;

//Public Getter - I don't know the conventions of nodejs ;-;
module.exports.getClient = function () { return client; };

//Keep kanabot running forever
setInterval(function () {
    if (!client.token ){//|| !client.ws.ws || client.ws.ws._closeReceived) {
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
    /*
    if(shutdown){
        getUserById(DEV).sendMessage("restart from shutdown");
    }else{
        if(getUserById(DEV).presence.status=="online")
            //getUserById(DEV).sendMessage("why");
    }*/
    shutdown = false;
    client.user.setGame("kanabot.herokuapp.com");
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
    } else if (cleanmsg.startsWith('med')) {
        if (cleanmsg.length <= 4) {
            return false;
        }
        msg.channel.sendMessage("*.....*").then(message => msg.channel.bulkDelete([msg, message]));
        if (cleanmsg.startsWith('medmed ')) {
            if (cleanmsg.length <= 7) {
                return false;
            }
            msg.channel.sendMessage(medmed(cleanmsg.substring(7, cleanmsg.length)) + "\n-" + msg.author.toString());
        } else {
            msg.channel.sendMessage(med(cleanmsg.substring(4, cleanmsg.length)) + "\n-" + msg.author.toString());
        }
    } else if (cleanmsg.startsWith('music ')) {
        var musicComm = cleanmsg.substring(6, cleanmsg.length);
        music.commands(musicComm, msg);
    } else if (cleanmsg == "help" || cleanmsg == "commands") {
        var helpcmd = "";
        helpcmd += "\n**General commands: **\ngheat,gseng\nrapecount [user]\nkapparr <url to shorten>\nmed <message>\nmedmed <message>\n";
        helpcmd += "\n**Music commands: **\n*@kana music before all commands if you are not in a channel named \"music\"*\n";
        helpcmd += "play\nadd <search terms>\npladd <search terms>\nstop\npause\nq,queue\nskip [index]\ncurrent [property] *use property proplist*\ncleanq | clearq\nprogress\njump | jumpto <seconds | minutes:seconds>\nvolume [number] *default is 1, 2 for example is double*\naeg\n";
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
    } else if (msg.cleanContent.startsWith('reply ')) {
        lastpm.sendMessage(msg.cleanContent.substring(6));
    } else if (cleanmsg.startsWith('emojispam')){
        emojispam(msg);
    } else if (cleanmsg.startsWith('ev')) {
        try {
            eval(cleanmsg.substring(3, cleanmsg.length));
        } catch (e) {
            getUserById(DEV).sendMessage(e.message);
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
    return med + "**";
}

function medmed(nomed) {
    var med = "";
    nomed.split(" ").forEach(function (e) {
        var pattern = /[A-z]/g;
        var matches = e.match(pattern);
        if (matches.length != e.length) return "eeh i mog umlaute zu emojis mochnnn";
        for (var i = 0; i < e.length; i++) {
            med += ":regional_indicator_" + e[i].toLowerCase() + ": ";
        }
        med += " ";
    });
    return med;
}

function emojispam(msg) {
    msg.guild.emojis.forEach(function (emoji) {
        msg.react(emoji);
    });
}

function reminder(msg,text,time){
    setTimeout(function(){
        msg.reply(text);
    },MINUTE*60*time);
}