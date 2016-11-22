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

function login(){
	pg.defaults.ssl = true;
	pg.connect(process.env.DATABASE_URL, function(err, db) {
		db.query("SELECT * FROM token", function(err, result) {
	      	if (err)
	    		console.log(err);
	      	else{
	    		client.login(result.rows[0].tkn);
	      	}
	   		db.end(function (err) {
	      		if (err) console.log(err);
	    	});
	    });		
	});
}

function database(){
	pg.defaults.ssl = true;
	pg.connect(process.env.DATABASE_URL, function(err, client,done) {

  	});
}

function query(client,q){
	var res;
	client.query(q, function(err, result) {
      	if (err)
    		console.log(err);
      	else{
    		console.log(result);
      	}
   		client.end(function (err) {
      		if (err) console.log(err);
    	});
    });
}

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
        	var usr = msg.mentions.users.array()[1].username+"#"+msg.mentions.users.array()[1].discriminator;
        	getCount(usr,msg);
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
function clearDatabase(){
	pg.defaults.ssl = true;
	pg.connect(process.env.DATABASE_URL, function(err, client,done) {
		client.query("DELETE from rape;",function(err, result){
			if(err)
				console.log(err);
			else{
				console.log(result);
			}
		});
		done();
	});
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

function increment(name){
	pg.defaults.ssl = true;
	pg.connect(process.env.DATABASE_URL, function(err, client,done) {
		client.query("SELECT * FROM rape WHERE name = '"+name+"';", function(err, result) {
	      	if (err){
	      		console.log(err);
	      	}
	      	else{
	      		if(result.rows.length == 0){
	      			client.query("INSERT INTO rape (name,count) VALUES('"+name+"',"+1+");", function(err, result) {
	    				if (err){
				    		console.log(err);console.log("INSERT INTO rape (name,count) VALUES('"+name+"',"+1+");");
	    				}
				      	else{
				    		console.log(result);
				      	}
    				});
	      		}else{
	    			client.query("UPDATE rape SET count = count+1 WHERE name = '"+name+"';",function(err, result){
	    				if(err){
	    					console.log(err);console.log("UPDATE rape SET count = count+1 WHERE name = '"+name+"';");
	    				}
	    				else{
	    					console.log(result);
	    				}
	    			});
    			}
	      	}
	   		done();
    	});
  	});
}

function getCount(usr,msg){
	pg.defaults.ssl = true;
	pg.connect(process.env.DATABASE_URL, function(err, client,done) {
		client.query("SELECT * FROM rape WHERE name = '"+usr+"';",function(err, result){
			if(err)
				console.log(err);
			else{
				console.log("SELECT * FROM rape WHERE name = '"+usr+"';");
				console.log(result.rows);
				msg.reply("RapeCount: "+result.rows[0].count);
			}
		});
		done();
	});
}

function getRapes(msg){
	pg.defaults.ssl = true;
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		client.query("SELECT * FROM rape;",function(err, result){
			if(err)
				console.log(err);
			else{
				var table = "\nUsername | RapeCount\n";
				result.rows.forEach(function(element){
					table+=element.name+" | "+element.count+"\n";
				});
				msg.reply(table);
			}
		});
		done();
	});
}