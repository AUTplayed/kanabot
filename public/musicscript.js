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
});

function setCurrent(){
    $.getJSON("/current", function(data){
        data = JSON.parse(data);
        $("#current").html("<tr><td class = 'text-left'><a href='"+data.url+"'>"+data.title+"</a></td><td id='progress'></td></tr>");
    });
}

function setProgress(){
    $.get("/progress", function(data){
    	$("#progress").text(data);
    });
}

function setQueue(){
    $.getJSON("/queue", function(data) {
        data = JSON.parse(data);
        data.forEach(function(element){
            $("#queue").append("<tr><td class = 'text-left'><a href='"+element.url+"'>"+element.title+"</a></td><td class = 'text-left'>"+element.length+"</td></tr>");
        });
    });
}