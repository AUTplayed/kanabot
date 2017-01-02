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
    var data_recieved = false;
    $.getJSON("/current", function(data){
        if(data){
            data_recieved = true;
            data = JSON.parse(data);
            $("#current").html("<tr><td><img src="+data.thumbnail+" alt='no thumbnail available'></td><td><a href='"+data.url+"'>"+data.title+"</a></td><td id='progress'></td></tr>");
        }
    });
    if(!data_recieved)
        $("#current").html("<tr><td colspan='3'>No song currently playing</td></tr>");
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
        if(data.length < 1)
            $("#queue").html("<tr><td colspan='3'>No songs in queue</td></tr>");
        data.forEach(function(element){
            $("#queue").append("<tr><td><img src="+element.thumbnail+" alt='no thumbnail available'></td><td><a href='"+element.url+"'>"+element.title+"</a></td><td>"+element.length+"</td></tr>");
        });
    });
}