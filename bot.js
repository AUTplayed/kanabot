const Discord = require("discord.js");
const client = new Discord.Client();
var msglog = [];
var count = 0;

var http = require('http');
http.createServer(function (req, res) { 
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write('it is running\n');
    res.end();
}).listen(process.env.PORT || 5000);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.username}#${client.user.discriminator}`);
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
    if (msglog.length >= 5)
        msglog.shift();
});
client.login('MjQ3NjIwNzcyMzk3MzE4MTYz.CwsI0g.1QE29N_6Ts6n6p-NYGw0GiokFB0');

function reply(msg) {
    if (msg.isMentioned(client.user)) {
        var cleanmsg = clearMentions(msg.cleanContent);
        if (cleanmsg == 'gheat' || cleanmsg == 'gseng') {
        	if(msglog.length==0){
        		msg.reply("nix zum seng");
        	}
        	else{
            	formatArray(msg.channel.name);
        	}
        } else if (cleanmsg == 'debug' && msg.author.id == 163651635845922816) {
            msg.reply("Message Log Length: " + msglog.length);
            msg.reply("Messages since last edit: " + count);
        }
    } else {
        if (msglog != [])
            count++;
        if (count >= 20) {
            count = 0;
            msglog = [];
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

function formatArray(channel) {
    var toremove = [];
    msglog.forEach(function(element) {
    	if(element.channel.name==channel){
        	element.reply(element.cleanContent);
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
    })
}
