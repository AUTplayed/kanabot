$(document).ready(function() {
    $.getJSON("/data", function(data) {
        data = JSON.parse(data);
        data.forEach(function(element){
            $("#tabledata").append("<tr><td class = 'text-left'>"+element.name+"</td><td class = 'text-left'>"+element.count+"</td>");
        });
    });
});
