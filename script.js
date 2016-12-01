var pg = require('pg');

$(document).ready(function(){
	connectAndQuery("select * from rape",function(rows){
		rows.forEach(function(element){
			$("#table").append("<tr><td>"+element.name+"</td><td>"+element.count+"</td>");
		});
	});
}

function connectAndQuery(query, followup) {
    pg.defaults.ssl = true;
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        if (err) console.log(err);
        else {
            client.query(query, function(err, result) {
                if (err) console.log(err);
                else {
                    followup(result.rows, client);
                }
            });
        }
        done();
    });
}