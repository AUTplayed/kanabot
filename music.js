var https = require("https");
var yt = require('ytdl-core');

var voiceChannel;
var player;
var queue = [];
var playing;
var stopped = false;

module.exports = {
    youtube:function(query,followup){
        youtube(query,followup);
    },
    commands:function(cleanmsg,msg){
        commands(cleanmsg,msg);
    }
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
        res.once('end', function () {
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

function commands(cleanmsg, msg) {
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
    else if (cleanmsg.startsWith("skip")) {
        skip(msg);
    }
    else if(cleanmsg.startsWith("current")){
        if(cleanmsg.length > 8)
            current(msg,cleanmsg.split(" ")[1]);
        else
            current(msg,undefined);
    }
    else if (cleanmsg.startsWith("q")) {
        var q = "";
        queue.forEach(function (e) {
            q += e.title + "\n";
        });
        msg.reply("queue:\n" + q);
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
            yt.getInfo("https://www.youtube.com" + url, function (err, info) {
                queue.push(info);
                msg.channel.sendMessage("Added " + info.title);
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
        player = connection.playStream(yt.downloadFromInfo(info, { audioonly: true }));
        msg.channel.sendMessage("Now playing " + info.title);
        eventRecursion(player, connection, msg.channel);
    });
}

function eventRecursion(pl, connection, channel) {
    pl.once('end', function () {
        playing = undefined;
        if (queue.length <= 0) {
            if (voiceChannel)
                voiceChannel.leave();
            voiceChannel = undefined;
        } else if(!stopped){
            var info = queue.shift();
            playing = info;
            player = connection.playStream(yt.downloadFromInfo(info, { audioonly: true }));
            channel.sendMessage("Now playing " + info.title);
            eventRecursion(player, connection, channel);
        }
        stopped=false;
    });
}

function skip(msg) {
    try {
        player.end();
    } catch (ex) {
        msg.reply("No current playback running");
    }
}
function current(msg,property){
    if(playing){
        if(property){
            if(property=="proplist"){
                for(var prop in playing){
                    msg.author.sendMessage(prop);
                }
            }
            else
                msg.reply(playing[property]);
        }
        else
            msg.reply(playing.title);
    }else{
        msg.reply("No song playing currently");
    }
}

function stop(msg) {
    try {
        voiceChannel.leave();
        voiceChannel = undefined;
        stopped=true;
    } catch (ex) {
        msg.reply("No current playback running");
    }
}
