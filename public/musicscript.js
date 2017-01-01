$(document).ready(function() {
    $.getJSON("/queue", function(data) {
        data = JSON.parse(data);
        data.forEach(function(element){
            $("#tabledata").append("<tr><td class = 'text-left'>"+element.title+"</td><td class = 'text-left'>"+element.length+"</td><td class = 'text-left'>"+element.url+"</td>");
        });
    });
});
