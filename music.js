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

//Module exports
module.exports.youtube = youtube;
module.exports.commands = commands;

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
        add(query, msg);
    }
    else if(cleanmsg.startsWith("pladd ")) {
        if (cleanmsg.length < 7)
            return;
        var query = cleanmsg.substring(6, cleanmsg.length);
        add(query, msg, function(){ play(msg); });
    }
    else if (cleanmsg.startsWith("stop")) {
        stop(msg);
    }
    else if (cleanmsg.startsWith("skip")) {
        if(cleanmsg.length > 5){
            var split = cleanmsg.split(" ");
            if(split[1]){
                var num = parseInt(split[1]);
                if((num || num == 0)&& queue[num]){
                    var removed = queue.splice(num,1)[0];
                    msg.channel.sendMessage("Removed "+removed.title+" from queue");
                    return;
                }
            }
        }
        skip(msg);
    }
    else if(cleanmsg.startsWith("current")){
        if(cleanmsg.length > 8)
            current(msg,cleanmsg.split(" ")[1]);
        else
            current(msg,undefined);
    }
    else if(cleanmsg.startsWith("volume ")){
        if(cleanmsg.length < 8){
            msg.reply("current volume: "+volume);
            return;
        }
        if(player){
            var tempvolume = parseFloat(cleanmsg.split(" ")[1]);
            if(tempvolume || tempvolume == 0){
                volume = tempvolume;
            }
            player.setVolume(volume);
        }
        else{
            msg.reply("Not playing!");
        }
    }
    else if(cleanmsg.startsWith("disconnect")){
        var client = require('./bot.js').getClient();
        if(client.voiceConnections){
            client.voiceConnections.forEach(function(e){
                e.disconnect();
            });
        }
        else{
            msg.reply("Not connected to any voice channel");
        }
    }
    else if (cleanmsg=="queue" || cleanmsg == "q") {
        var q = "";
        queue.forEach(function (e,i) {
            q += i + ": " + e.title + "\n";
        });
        msg.reply("queue:\n" + q);
    }
}

function add(query, msg, followup) {
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
                if(!info){
                    msg.reply("There was an error fetching your video, please try again");
                }else{
                    queue.push(info);
                    msg.channel.sendMessage("Added " + info.title);
                    if(followup){
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
        player = connection.playStream(yt.downloadFromInfo(info, { audioonly: true }));
        player.setVolume(volume);
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
            player.setVolume(volume);
            channel.sendMessage("Now playing " + info.title);
            eventRecursion(player, connection, channel);
        }
        stopped=false;
    });
}

function skip(msg) {
    if(player){
        msg.channel.sendMessage("Skipped "+playing.title);
        player.end();
    } else{
        msg.reply("No current playback running");
    }
}
function current(msg,property){
    try{
        if(playing){
            if(property){
                if(property=="proplist"){
                    var proplist = "";
                    for(var prop in playing){
                        proplist+=prop+"\n";
                    }
                    msg.author.sendMessage(proplist);
                }
                else
                    msg.reply(playing[property]);
            }
            else
                msg.reply(playing.title);
        }else{
            msg.reply("No song playing currently");
        }
    } catch (ex) {
        msg.reply(ex.message);
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
