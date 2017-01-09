var tempScrollTop;

$(document).ready(function () {
    setQueue();
    setCurrent();
    setProgress();

    setInterval(function () {
        setProgress();
        var split = $("#progress").text().split("/");
        if (split[0] == split[1] || split[0] == "0:00") {
            setTimeout(function () {
                setQueue();
                setCurrent();
            }, 2500);
        }
    }, 1000);
    $("#refresh").click(function () {
        setQueue();
        setCurrent();
    });
});

function setCurrent() {
    var data_recieved = false;
    $.getJSON("/current", function (data) {
        if (data) {
            data_recieved = true;
            data = JSON.parse(data);
            $("#current").html("<tr><td><img src=" + data.thumbnail + " alt='no thumbnail available'></td><td><a href='" + data.url + "'>" + data.title + "</a></td><td id='progress'></td></tr>");
        }
    });
    if (!data_recieved)
        $("#current").html("<tr><td colspan='3'>No song currently playing</td></tr>");
}

function setProgress() {
    if ($('#progress').length) {
        $.get("/progress", function (data) {
            $("#progress").text(data);
        });
    }
}

function setQueue() {
    tempScrollTop = $(window).scrollTop();
    $.getJSON("/queue", function (data) {
        data = JSON.parse(data);
        if (data.length < 1)
            $("#queue").html("<tr><td colspan='4'>No songs in queue</td></tr>");
        else
            $("#queue").html(" ");
        data.forEach(function (element) {
            $("#queue").append("<tr><td id='index'>" + element.index + "</td><td><img src=" + element.thumbnail + " alt='no thumbnail available'></td><td><a href='" + element.url + "'>" + element.title + "</a></td><td>" + element.length + "</td></tr>");
        });
        $(window).scrollTop(tempScrollTop);
    });

}

//Copy-Pasted Stuff
//Deal with it



// Trigger action when the contexmenu is about to be shown
$(document).bind("contextmenu", function (event) {
    var clicked;
    // Avoid the real one
    event.preventDefault();
    clicked = document.elementFromPoint(event.pageX-window.pageXOffset, event.pageY-window.pageYOffset);
    if(clicked)
        clicked = clicked.parentElement;
    if (clicked) {
        if (clicked.nodeName == "TR") {
            $(".custom-menu").html('<li data-action="skip">Skip</li>');

            // If the menu element is clicked
            $(".custom-menu li").click(function () {

                // This is the triggered action name
                switch ($(this).attr("data-action")) {
                    // A case for each action. Your actions here
                    case "skip":
                        if (clicked.querySelector('#index')) {
                            $.get("/skip/" + clicked.querySelector('#index').innerHTML, function (data) {
                                console.log(data);
                                setQueue();
                                setCurrent();
                            });
                        }
                        else {
                            $.get("/skip/-1", function (data) {
                                console.log(data);
                            });
                        }
                        break;
                }

                // Hide it AFTER the action was triggered
                $(".custom-menu").hide(100);
            });
        }
        else {
            $(".custom-menu").html("");
        }
        // Show contextmenu
        $(".custom-menu").finish().toggle(100).

            // In the right position (the mouse)
            css({
                top: event.pageY + "px",
                left: event.pageX + "px"
            });
    }
});


// If the document is clicked somewhere
$(document).bind("mousedown", function (e) {

    // If the clicked element is not the menu
    if (!$(e.target).parents(".custom-menu").length > 0) {

        // Hide it
        $(".custom-menu").hide(100);
    }
});


