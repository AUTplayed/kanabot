$(document).ready(function() {
    $.getJSON("/data", function(data) {
        data = JSON.parse(data);
        data.forEach(function(element){
            $("#table").append("<tr><td>"+element.name+"</td><td>"+element.count+"</td>");
        });
    });
});
