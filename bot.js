const Discord = require("discord.js");
var pg = require('pg');
var http = require("http");
var fs = require('fs');
const client = new Discord.Client();
var msglog = [];

var options = {
	host:"scribblethis.herokuapp.com",
	path: "/"
};
setInterval(function(){
	http.request(options,function(r){}).end();
},1.2e+6);

login();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.username}#${client.user.discriminator}`);
});

client.on('message', message => {
	if(message.author.bot)
		return;
    try {
        reply(message);
    } catch (error) {
    	console.log(error);
    }
});

client.on('messageUpdate', (oldMessage, newMessage) => {
	if(newMessage.author.bot)
		return;
	if(newMessage.editedAt && oldMessage.cleanContent!= newMessage.cleanContent){
		msglog.push(oldMessage);
	}
});

client.on('messageDelete', (message) => {
	if(message.author.bot)
		return;
    msglog.push(message);
});

client.on('messageDeleteBulk', (messages) => {
	if(messages.array().length>=5){
		return;
	}
	messages.array().forEach(function(element){
		if(!element.author.bot){
			msglog.push(message);
		}
	});
});

function reply(msg) {
    if (msg.isMentioned(client.user)) {
        var cleanmsg = clearMentions(msg.content);
        console.log(cleanmsg);
        if (cleanmsg == 'gheat' || cleanmsg == 'gseng') {
        	if(rape(msg.channel.name,msg.guild.name)==false){
        		msg.reply("nix zum seng");
        	}
        }
        else if(cleanmsg.startsWith('rapecount ')){
        	msg.mentions.users.array().forEach(function(element){
        		var usr = element.username+"#"+element.discriminator;
        		if(usr!="kana#7526"){
        			getCount(usr,msg);
        		}
        	});
        }
        else if (msg.author.id == 163651635845922816) {
        	devCommands(msg,cleanmsg);
        }
    }
}

function devCommands(msg,cleanmsg){
	if(cleanmsg == 'log'){
    	msg.reply("Message Log\n" +msglog);
	}
	else if(cleanmsg == 'cm'){
		msglog = [];
	}
	else if(cleanmsg == 'trc'){
		getRapes(msg);
	}
	else if(cleanmsg == 'cdb'){
		clearDatabase();
	}
}


function clearMentions(msg) {
    var tags = msg.match("<@.*?>");
    tags.forEach(function(element) {
        msg = msg.replace(element,"");
    });
    return msg.trim();
}

function rape(channel,guild) {
    var toremove = [];
    var replied = false;
    msglog.forEach(function(element) {
    	if((Date.now()-element.createdTimestamp)>=300000)
    		toremove.push(msglog.indexOf(element));
    	else if(element.channel.name==channel&&element.guild.name==guild){
        	element.reply(element.cleanContent);
        	increment(element.author.username+"#"+element.author.discriminator);
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

function login(){
	connectAndQuery("SELECT * FROM token",function(rows){
		client.login(rows[0].tkn);
	});
}

function clearDatabase(){
	connectAndQuery("DELETE from rape;",function(rows){
		console.log("Table deleted");
	});
}

function increment(name){
  	connectAndQuery("SELECT * FROM rape WHERE name = '"+name+"';",function(rows,client){
  		if(rows.length == 0){
  			executeQuery("INSERT INTO rape (name,count) VALUES('"+name+"',"+1+");",client,function(rows){
  				console.log("Inserted "+name);
  			});
  		}
  		else{
  			executeQuery("UPDATE rape SET count = count+1 WHERE name = '"+name+"';",client,function(rows){
  				console.log("Updated "+name);
  			});
  		}
  	});
}

function getCount(usr,msg){
	connectAndQuery("SELECT * FROM rape WHERE name = '"+usr+"';",function(rows){
		msg.reply("RapeCount of "+usr+": "+rows[0].count);
	});
}

function getRapes(msg){
	connectAndQuery("SELECT * FROM rape;",function(rows){
		var table = "\nUsername | RapeCount\n";
		rows.forEach(function(element){
			table+=element.name+" | "+element.count+"\n";
		});
		msg.reply(table);
	});
}

function connectAndQuery(query,followup){
	pg.defaults.ssl = true;
	pg.connect(process.env.DATABASE_URL, function(err, client, done){
		if(err) console.log(err);
		else{
			client.query(query,function(err,result){
				if(err) console.log(err);
				else{
					followup(result.rows,client);
				}
			});
		}
		done();
	});
}

function executeQuery(query,client,followup){
	client.query(query,function(err,result){
		if(err) console.log(err);
		else{
			followup(result.rows);
		}
	});
}