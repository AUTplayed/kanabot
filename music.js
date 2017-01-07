//External dependencies
var yt = require('./yt.js');
var ytdl = require('ytdl-core');

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
module.exports.commands = commands;
module.exports.add = add;
module.exports.skip = skip;
module.exports.jump = jump;
module.exports.changeVolume = changeVolume;
module.exports.progress = progress;
module.exports.getVolume = function () { return volume }
module.exports.getQueue = getQueue;
module.exports.getCurrent = getCurrent;

function commands(cleanmsg, msg) {
    if (cleanmsg.startsWith("play")) {
        play(msg);
    }
    else if (cleanmsg.startsWith("add ")) {
        if (cleanmsg.length < 5)
            return;
        var query = cleanmsg.substring(4, cleanmsg.length);
        add(query, function (output) { msg.channel.sendMessage(output); }, undefined);
    }
    else if (cleanmsg.startsWith("pladd ")) {
        if (cleanmsg.length < 7)
            return;
        var query = cleanmsg.substring(6, cleanmsg.length);
        add(query, function (output) { msg.channel.sendMessage(output); }, function () { play(msg); });
    }
    else if (cleanmsg.startsWith("stop")) {
        stop(msg);
    }
    else if (cleanmsg.startsWith("skip")) {
        if (cleanmsg.length > 5) {
            var split = cleanmsg.split(" ");
            if (split[1]) {
                skip(split[1], function (output) { msg.channel.sendMessage(output); });
            }
        }
        skip(-1, function (output) { msg.channel.sendMessage(output); });
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
            jump(split[1], false, function (output) { msg.channel.sendMessage(output); });
        } else {
            if (cleanmsg.length < 6)
                return;
            jump(split[1], true, function (output) { msg.channel.sendMessage(output); });
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
    var count = 0;
    yt.get(query, function (info) {
        count++;
        if(!info){
            output("Failed to add song");
        }
        else if(!info.title){
            output("Failed to add song with url: "+info);
        }
        else if (info) {
            queue.push(info);
            if (count <= 5) {
                var out = "Added " + info.title;
                if (count == 10)
                    out+="\nusw...";
                output(out);
            }
        }
        if (followup && count == 1) {
            followup();
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
        player = connection.playStream(ytdl.downloadFromInfo(info, { audioonly: true }), { volume: volume });
        msg.channel.sendMessage("Now playing " + info.title);
        eventRecursion(player, connection, msg.channel);
    });
}

function eventRecursion(pl, connection, channel) {
    pl.once('end', function () {
        if (jumpto || jumpto == 0) {
            player = connection.playStream(ytdl.downloadFromInfo(playing, { audioonly: true }), { volume: volume, seek: jumpto });
            eventRecursion(player, connection, channel);
        }
        else if (queue.length <= 0) {
            playing = undefined;
            if (voiceChannel)
                voiceChannel.leave();
            voiceChannel = undefined;
        } else if (!stopped) {
            playing = undefined;
            prevjump = 0;
            var info = queue.shift();
            playing = info;
            player = connection.playStream(ytdl.downloadFromInfo(info, { audioonly: true }), { volume: volume });
            channel.sendMessage("Now playing " + info.title);
            eventRecursion(player, connection, channel);
        }
        stopped = false;
        jumpto = undefined;
    });
}

function changeVolume(vol) {
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
    if (index >= 0) {
        var num = parseInt(index);
        if ((num || num == 0) && queue[num]) {
            var removed = queue.splice(num, 1)[0];
            output("Removed " + removed.title + " from queue");
            return;
        }
    }
    if (!player) {
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
        stopped = true;
        player.end();
        voiceChannel.leave();
        voiceChannel = undefined;
    } catch (ex) {
        msg.reply("No current playback running");
    }
}

function progress() {
    if (!player || !playing)
        return "-";
    var curTime = toTime(prevjump + player.time / 1000);
    var maxTime = toTime(playing.length_seconds);
    return curTime + "/" + maxTime;
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
    if (seconds < 10)
        return minutes + ":0" + seconds;
    return minutes + ":" + seconds;
}

function getQueue() {
    var webq = [];
    queue.forEach(function (e, i) {
        var webe = new Object();
        webe.title = e.title;
        webe.length = toTime(e.length_seconds);
        webe.url = "https://youtube.com/watch?v=" + e.video_id;
        webe.thumbnail = e.thumbnail_url;
        webe.index = i;
        webq.push(webe);
    });
    return webq;
}

function getCurrent() {
    if (!playing)
        return undefined;
    var webc = new Object();
    webc.title = playing.title;
    webc.url = "https://youtube.com/watch?v=" + playing.video_id;
    webc.thumbnail = playing.thumbnail_url;
    return webc;
}