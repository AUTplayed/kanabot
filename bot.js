const Discord = require("discord.js");
var http = require("http");
const client = new Discord.Client();
var msglog = [];
var rapecount = 0;
var starttime;
//var errorlog = [];
/*
var http = require('http');
http.createServer(function (req, res) { 
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write("Log:\n")
    res.write(arrayToString(errorlog));
    res.end();
}).listen(process.env.PORT || 5000);
*/

var options = {
	host:"scribblethis.herokuapp.com",
	path: "/"
};

setInterval(function(){
	console.log("request");
	http.request(options,function(r){}).end();
},1.2e+6);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.username}#${client.user.discriminator}`);
    starttime = Date.now();
});

client.on('message', msg => {
    try {
        reply(msg);
    } catch (error) {
    	console.log(error);
    }

});
client.on('messageUpdate', (oldMessage, newMessage) => {
    msglog.push(oldMessage);
});
client.login('MjQ3NjIwNzcyMzk3MzE4MTYz.CwsI0g.1QE29N_6Ts6n6p-NYGw0GiokFB0');

function reply(msg) {
    if (msg.isMentioned(client.user)) {
        var cleanmsg = clearMentions(msg.cleanContent);
        if (cleanmsg == 'gheat' || cleanmsg == 'gseng') {
        	if(formatArray(msg.channel.name,msg.guild.name)==false){
        		msg.reply("nix zum seng");
        	}
        	else{
        		rapecount++;
        	}
        } else if (msg.author.id == 163651635845922816) {
        	if(cleanmsg == 'debug'){
            	msg.reply("Message Log\n" + arrayToString(msglog));
        	}
        	else if(cleanmsg == 'clearMessages'){
        		msglog = [];
        	}
        	else if(cleanmsg == 'rapecount'){
        		msg.reply("RapeCount: "+rapecount+" seit "+starttime);
        	}
        }
    }
}

function clearMentions(msg) {
    var split = msg.split(" ");
    var cleanmsg = "";
    split.forEach(function(element) {
        if (!element.startsWith("@"))
            cleanmsg += element + " ";
    });
    return cleanmsg.trim();
}

function formatArray(channel,guild) {
    var toremove = [];
    var replied = false;
    msglog.forEach(function(element) {
    	if((Date.now()-element.createdTimestamp)>=3600000)
    		toremove.push(msglog.indexOf(element));
    	else if(element.channel.name==channel&&element.guild.name==guild){
        	element.reply(element.cleanContent);
        	replied = true;
        	toremove.push(msglog.indexOf(element));
    	}
    });
    var removed = 0;
    toremove.forEach(function(element){
    	if(msglog.length == 1){
    		msglog=[];
    	}
    	else{
    		msglog = msglog.splice(element-(removed++),1);
    	}
    });
    return replied;
}
function arrayToString(array){
	var s = "";
	array.forEach(function(element){
		s+=element.cleanContent+"\n";
	});
	return s;
}
