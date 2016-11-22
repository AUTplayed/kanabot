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

database();
//login();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.username}#${client.user.discriminator}`);
    try{
    	readData();
    	//readFile();
    	//database();
	} catch(error){
		console.log(error);
	}
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
function readData(){
	pg.defaults.ssl = true;
	pg.connect(process.env.DATABASE_URL, function(err, client) {
		client.query("SELECT * FROM rape", function(err, result) {
	      	if (err)
	    		console.log(err);
	      	else{
	    		rape=result.rows;
	      	}
	   		client.end(function (err) {
	      		if (err) console.log(err);
	    	});
    	});
  	});
}

function writeData(){

}

function database(){
	pg.defaults.ssl = true;
	pg.connect(process.env.DATABASE_URL, function(err, client) {
		client.query("DELETE from token",function(err, client){
			console.log(err);
			console.log(result);
		});
		client.query("INSERT INTO token VALUES('"+"MjQ3NjIwNzcyMzk3MzE4MTYz.CxWBMQ.bpy9y0fo_0th7xELtyENJctxq3U"+"');",function(err,result){
			console.log(err);
			console.log(result);
		});
    	client.end(function (err) {
      		if (err) console.log(err);
    	});
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
    	if(!rapecount[msg.guild.name]){
    		rapecount[msg.guild.name]=0;
    		writeFile();
    	}
        var cleanmsg = clearMentions(msg.cleanContent);
        if (cleanmsg == 'gheat' || cleanmsg == 'gseng') {
        	if(rape(msg.channel.name,msg.guild.name)==false){
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
		var sum = 0;
		for(var i in rapecount){
			sum+=parseInt(rapecount[i]);
		}
		msg.reply("Total Sum of Rapes: "+sum);
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

function rape(channel,guild) {
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

function increment(name){
	pg.defaults.ssl = true;
	pg.connect(process.env.DATABASE_URL, function(err, client) {
		client.query("SELECT * FROM rape WHERE name="+name, function(err, result) {
	      	if (err)
	    		console.log(err);
	      	else{
	    		if(result.rows.length==0){
	    			client.query("INSERT INTO rape (name,count) VALUES('"+name+"',"+1+");", function(err, result) {
	    				if (err)
				    		console.log(err);
				      	else{
				    		console.log(result);
				      	}
	    			});
	    		}
	    		else{
	    			client.query("UPDATE rape SET count = count+1 WHERE name = '"+name+"';",function(err, result){
	    				if(err)
	    					console.log(err);
	    				else{
	    					console.log(result);
	    				}
	    			});
	    		}
	      	}
	   		client.end(function (err) {
	      		if (err) console.log(err);
	    	});
    	});
  	});
}

function getCount(msg){
	pg.defaults.ssl = true;
	pg.connect(process.env.DATABASE_URL, function(err, client) {
		client.query("SELECT * FROM rape WHERE name = '"+msg.guild.name+"';",function(err, result){
			if(err)
				console.log(err);
			else{
				msg.reply(result.rows[0].count);
			}
		});
	});
}
function readFile(){
	fs.open('rapecount.txt','a',(err,fd)=>{
		if(err) throw err;
	})
	fs.readFile('rapecount.txt','utf-8', (err, data) => {
		if (err) throw err;
		var servers = data.split("\n");
		servers.forEach(function(element){
			var split = element.split(",");
			rapecount[split[0]]=split[1];
		});
	});
}

function writeFile(){
	var s = "";
	for(var i in rapecount){
		s+=i+","+rapecount[i]+"\n";
	}
	fs.writeFile('rapecount.txt',s,(err)=>{
		if(err) throw err;
	});
}