const Discord = require("discord.js");
const client = new Discord.Client();
var msglog = [];
var errorlog = [];

var http = require('http');
http.createServer(function (req, res) { 
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write("Log:\n")
    res.write(arrayToString(errorlog));
    res.end();
}).listen(process.env.PORT || 5000);

client.on('ready', () => {
    errorlog.push(`Logged in as ${client.user.username}#${client.user.discriminator}`);
});

client.on('message', msg => {
    try {
        reply(msg);
    } catch (error) {
        errorlog.push(error);
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
        } else if (msg.author.id == 163651635845922816) {
        	if(cleanmsg == 'debug'){
            	msg.reply("Message Log\n" + msglog);
        	}
        	else if(cleanmsg == 'clearLog'){
        		errorlog=[];
        	}
        	else if(cleanmsg == 'clearMessages'){
        		msglog = [];
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
    	if(element.channel.name==channel&&element.guild.name==guild){
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
		s+=element+"\n";
	});
	return s;
}
