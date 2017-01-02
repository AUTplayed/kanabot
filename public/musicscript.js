$(document).ready(function() {
    setQueue();
    setCurrent();
    setProgress();

    setInterval(function(){
        setProgress();
        var split = $("#progress").text().split("/");
        if(split[0] == split[1]){
            setTimeout(function(){
                setCurrent();
                setQueue();
            },3000);
        }
    },1000);
    setInterval(function(){
        setCurrent();
        setQueue();
    },10000);
});

function setCurrent(){
    $.getJSON("/current", function(data){
        if(data!="undefined"){
            data = JSON.parse(data);
            $("#current").html("<tr><td><img src="+data.thumbnail+" alt='no thumbnail available'></td><td><a href='"+data.url+"'>"+data.title+"</a></td><td id='progress'></td></tr>");
        }else{
            $("#current").html("<tr>No song currently playing</tr>");
        }
    });
}

function setProgress(){
    $.get("/progress", function(data){
    	$("#progress").text(data);
    });
}

function setQueue(){
	$("#queue").html(" ");
    $.getJSON("/queue", function(data) {
        data = JSON.parse(data);
        data.forEach(function(element){
            $("#queue").append("<tr><td><img src="+data.thumbnail+" alt='no thumbnail available'></td><td><a href='"+element.url+"'>"+element.title+"</a></td><td>"+element.length+"</td></tr>");
        });
    });
}