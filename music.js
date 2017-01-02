//External dependencies
var https = require("https");
var yt = require('ytdl-core');

//Declarations
var voiceChannel;
var player;
var queue = [];
var playing;
var stopped = false;
var volume = 1.0;
var jumpto = undefined;
var prevjump = 0;

//Module exports
module.exports.youtube = youtube;
module.exports.commands = commands;
module.exports.add = add;
module.exports.skip = skip;
module.exports.jump = jump;
module.exports.changeVolume = changeVolume;
module.exports.progress = progress;
module.exports.getVolume = function () { return volume }
module.exports.getQueue = getQueue;
module.exports.getCurrent = getCurrent;

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
        res.once('end', function () {
            var pattern = /<a href=\"\/watch\?v=.*?\"/g;
            var matches = html.match(pattern);
            if (!matches || matches.length < 1)
                followup(undefined);
            else {
                matches = matches[0].split("\"")[1];
                console.log(matches);
                followup(matches);
            }
        });
    }).end();
}

function commands(cleanmsg, msg) {
    if (cleanmsg.startsWith("play")) {
        play(msg);
    }
    else if (cleanmsg.startsWith("add ")) {
        if (cleanmsg.length < 5)
            return;
        var query = cleanmsg.substring(4, cleanmsg.length);
        add(query, function(output){ msg.channel.sendMessage(output); }, undefined);
    }
    else if (cleanmsg.startsWith("pladd ")) {
        if (cleanmsg.length < 7)
            return;
        var query = cleanmsg.substring(6, cleanmsg.length);
        add(query, function(output){ msg.channel.sendMessage(output); }, function () { play(msg); });
    }
    else if (cleanmsg.startsWith("stop")) {
        stop(msg);
    }
    else if (cleanmsg.startsWith("skip")) {
        if (cleanmsg.length > 5) {
            var split = cleanmsg.split(" ");
            if (split[1]) {
                skip(split[1],function(output){ msg.channel.sendMessage(output); });
            }
        }
        skip(-1,function(output){ msg.channel.sendMessage(output); });
    }
    else if (cleanmsg.startsWith("current")) {
        if (cleanmsg.length > 8)
            msg.channel.sendMessage(current(msg, cleanmsg.split(" ")[1]));
        else
            msg.channel.sendMessage(current(msg, undefined));
    }
    else if (cleanmsg.startsWith("volume")) {
        if (cleanmsg.length < 8) {
            msg.reply("current volume: " + volume);
            return;
        }
        if (player) {
            changeVolume(cleanmsg.split(" ")[1]);
        }
        else {
            msg.reply("Not playing!");
        }
    }
    else if (cleanmsg.startsWith("jump")) {
        var split = cleanmsg.split(" ");
        if (!split[1])
            return;
        if (cleanmsg.startsWith("jumpto ")) {
            if (cleanmsg.length < 8)
                return;
            jump(split[1], false, function(output){ msg.channel.sendMessage(output); });
        } else {
            if (cleanmsg.length < 6)
                return;
            jump(split[1], true, function(output){ msg.channel.sendMessage(output); });
        }
    }
    else if (cleanmsg.startsWith("disconnect")) {
        var client = require('./bot.js').getClient();
        if (client.voiceConnections) {
            client.voiceConnections.forEach(function (e) {
                e.disconnect();
            });
        }
        else {
            msg.reply("Not connected to any voice channel");
        }
    }
    else if (cleanmsg.startsWith("progress")) {
        msg.reply(progress());
    }
    else if (cleanmsg == "queue" || cleanmsg == "q") {
        var q = "";
        queue.forEach(function (e, i) {
            q += i + ": " + e.title + "\n";
        });
        msg.reply("queue:\n" + q);
    }
}

function add(query, output, followup) {
    youtube(query, function (url) {
        if (!url) {
            output("No Video found");
        }
        else {
            yt.getInfo("https://www.youtube.com" + url, function (err, info) {
                if (!info) {
                    output("There was an error fetching your video, please try again");
                } else {
                    queue.push(info);
                    output("Added " + info.title);
                    if (followup) {
                        followup();
                    }
                }
            });
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
    if (queue.length == 0) {
        msg.reply("Queue is empty");
        return;
    }
    if (voiceChannel != undefined) {
        msg.reply("Already playing");
        return;
    }
    voiceChannel = msg.member.voiceChannel;
    voiceChannel.join().then(connection => {
        var info = queue.shift();
        playing = info;
        player = connection.playStream(yt.downloadFromInfo(info, { audioonly: true }), { volume: volume });
        msg.channel.sendMessage("Now playing " + info.title);
        eventRecursion(player, connection, msg.channel);
    });
}

function eventRecursion(pl, connection, channel) {
    pl.once('end', function () {
        if (jumpto || jumpto == 0) {
            player = connection.playStream(yt.downloadFromInfo(playing, { audioonly: true }), { volume: volume, seek: jumpto });
            eventRecursion(player, connection, channel);
        }
        else if (queue.length <= 0) {
            playing = undefined;
            if (voiceChannel)
                voiceChannel.leave();
            voiceChannel = undefined;
        } else if (!stopped) {
            playing = undefined;
            var info = queue.shift();
            playing = info;
            player = connection.playStream(yt.downloadFromInfo(info, { audioonly: true }), { volume: volume });
            channel.sendMessage("Now playing " + info.title);
            eventRecursion(player, connection, channel);
        }
        stopped = false;
        jumpto = undefined;
    });
}

function changeVolume(vol){
    var tempvolume = parseFloat(vol);
    if (tempvolume || tempvolume == 0) {
        volume = tempvolume;
    }
    player.setVolume(volume);
}

function jump(time, relative, output) {
    if (voiceChannel == undefined) {
        output("No current playback running");
        return;
    }
    var time = toSeconds(time);
    if (!time)
        return;
    if (relative) {
        time = player.time / 1000 + time;
        jumpto = time + prevjump;
    }
    else {
        jumpto = time;
    }
    if (jumpto >= playing.length_seconds || jumpto < 0) {
        output("Time outside of video length");
        return;
    }
    prevjump = jumpto;
    output("Jumping to " + toTime(jumpto));
    player.end();
}

function skip(index, output) {
    if(index >= 0){
        var num = parseInt(index);
        if ((num || num == 0) && queue[num]) {
            var removed = queue.splice(num, 1)[0];
            output("Removed " + removed.title + " from queue");
            return;
        }
    }
    if(!player){
        output("No current playback running");
        return;
    }
    output("Skipped " + playing.title);
    player.end();
}

function current(msg, property) {
    try {
        if (playing) {
            if (property) {
                if (msg && property == "proplist") {
                    var proplist = "";
                    for (var prop in playing) {
                        proplist += prop + "\n";
                    }
                    msg.author.sendMessage(proplist);
                }
                else
                    return playing[property];
            }
            else
                return playing.title;
        } else {
            return "No song playing currently";
        }
    } catch (ex) {
        return ex.message;
    }
}

function stop(msg) {
    try {
        player.end();
        voiceChannel.leave();
        voiceChannel = undefined;
        stopped = true;
    } catch (ex) {
        msg.reply("No current playback running");
    }
}

function progress(){
    if(!player)
        return "-";
    var curTime = toTime(prevjump+player.time/1000);
    var maxTime = toTime(playing.length_seconds);
    return curTime+"/"+maxTime;
}

function toSeconds(input) {
    var split = input.split(":");
    if (split.length > 1) {
        var minutes = parseFloat(split[0]);
        var seconds = parseFloat(split[1]);
        if ((minutes || minutes == 0) && (seconds || seconds == 0)) {
            return minutes * 60 + seconds;
        }
    } else {
        var seconds = parseFloat(input);
        if (seconds || seconds == 0) {
            return seconds;
        }
    }
    return undefined;
}

function toTime(input) {
    var minutes = Math.floor(input / 60);
    var seconds = Math.round(input % 60);
    if(seconds < 10)
        return minutes + ":0" + seconds;
    return minutes + ":" + seconds;
}

function getQueue(){
    var webq = [];
    queue.forEach(function(e){
        var webe = new Object();
        webe.title = e.title;
        webe.length = toTime(e.length_seconds);
        webe.url = "https://youtube.com/watch?v="+e.video_id;
        webq.push(webe);
    });
    return webq;
}

function getCurrent(){
    var webc = new Object();
    webc.title = current(undefined,"title");
    webc.url = current(undefined,"video_id");
    if(!webc.url.startsWith("No song"))
        webc.url = "https://youtube.com/watch?v="+webc.url;
    return webc;
}