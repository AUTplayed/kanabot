var tempScrollTop;

$(document).ready(function() {
    setQueue();
    setCurrent();
    setProgress();

    setInterval(function(){
        setProgress();
        var split = $("#progress").text().split("/");
        if(split[0] == split[1] || split[0] == "0:00"){
            setTimeout(function(){
                setQueue();
                setCurrent();
            },2500);
        }
    },1000);
    $("#refresh").click(function() {
        setQueue();
        setCurrent();
    });
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
    if($('#progress').length){
        $.get("/progress", function(data){
            $("#progress").text(data);
        });
    }
}

function setQueue(){
    tempScrollTop = $(window).scrollTop();
    var data_recieved = false;
    $.getJSON("/queue", function(data) {
        data = JSON.parse(data);
        if(data.length > 0)
            data_recieved = true;
        else
            $("#queue").html(" ");
        data.forEach(function(element){
            $("#queue").append("<tr><td>"+element.index+"</td><td><img src="+element.thumbnail+" alt='no thumbnail available'></td><td><a href='"+element.url+"'>"+element.title+"</a></td><td>"+element.length+"</td></tr>");
        });
        $(window).scrollTop(tempScrollTop);
    });
    if(!data_recieved)
        $("#queue").html("<tr><td colspan='4'>No songs in queue</td></tr>");
    
}