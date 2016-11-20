const Discord = require("discord.js");
var http = require("http");
var fs = require('fs');
const client = new Discord.Client();
var msglog = [];
var rapecount = [];
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
    readFile();
});

client.on('message', msg => {
    try {
        reply(msg);
    } catch (error) {
    	console.log(error);
    }

});
client.on('messageUpdate', (oldMessage, newMessage) => {
	if(newMessage.editedAt && oldMessage.cleanContent!= newMessage.cleanContent){
		msglog.push(oldMessage);
	}
    
});
client.on('messageDelete', (message) => {
    msglog.push(message);
});
client.login('MjQ3NjIwNzcyMzk3MzE4MTYz.CwsI0g.1QE29N_6Ts6n6p-NYGw0GiokFB0');

function reply(msg) {
    if (msg.isMentioned(client.user)) {

    	if(!rapecount[msg.guild.name]){
    		rapecount[msg.guild.name]=0;
    		writeFile();
    	}
        var cleanmsg = clearMentions(msg.cleanContent);
        if (cleanmsg == 'gheat' || cleanmsg == 'gseng') {
        	if(formatArray(msg.channel.name,msg.guild.name)==false){
        		msg.reply("nix zum seng");
        	}
        	else{
        		rapecount[msg.guild.name]++;
        		writeFile();
        	}
        }
        else if(cleanmsg == 'rapecount'){
        	msg.reply("RapeCount: "+rapecount[msg.guild.name]);
        }
        else if (msg.author.id == 163651635845922816) {
        	if(cleanmsg == 'log'){
            	msg.reply("Message Log\n" + arrayToString(msglog));
        	}
        	else if(cleanmsg == 'cm'){
        		msglog = [];
        	}
        	else if(cleanmsg == 'trc'){
        		var sum = 0;
        		for(var i in rapecount){
        			sum+=parseInt(rapecount[i]);
        		}
        		msg.reply("Total Sum of Rapes: "+sum);
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
    	if((Date.now()-element.createdTimestamp)>=300000)
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
function formatMessages(array){
	var s = "";
	array.forEach(function(element){
		s+=element.cleanContent+"\n";
	});
	return s;
}
function rapeArrayToString(){
	var s = "";
	for(var i in rapecount){
		s+=i+","+rapecount[i]+"\n";
	}
	return s;
}
function rapeStringToArray(string){
	var servers = string.split("\n");
	servers.forEach(function(element){
		var split = element.split(",");
		rapecount[split[0]]=split[1];
	});
}

function readFile(){
	fs.readFile('rapecount.txt','utf-8', (err, data) => {
		if (err) throw err;
		rapeStringToArray(data);
	});
}
function writeFile(){
	fs.writeFile('rapecount.txt',rapeArrayToString(),(err)=>{
		if(err) throw err;
	});
}