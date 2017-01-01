$(document).ready(function() {
    $.getJSON("/queue", function(data) {
        data = JSON.parse(data);
        data.forEach(function(element){
            $("#queue").append("<tr><td class = 'text-left'>"+element.title+"</td><td class = 'text-left'>"+element.length+"</td><td class = 'text-left'><a href='"+element.url+"'>"+element.url+"</a></td></tr>");
        });
    });
    $.getJSON("/current", function(data){
        data = JSON.parse(data);
        $("#current").html("<tr><td class = 'text-left'>"+data.title+"</td><td class = 'text-left'><a href='"+data.url+"'>"+data.url+"</a></td><td id='progress'></td></tr>");
    });
    $.get("/progress", function(data){
    	$("#progress").text(data);
    });
});
