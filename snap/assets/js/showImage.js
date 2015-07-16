// var base = "http://rishabh-apps.s3-website-us-east-1.amazonaws.com/Site/SnapChat-Clone/";
var base = "http://herbage.s3-ap-northeast-1.amazonaws.com/snapdong-clone/"
var user_picture;

var animateDown = function(targetElement, speed){
    $(targetElement).css({top: 0});
    $(targetElement).animate(
    {
        'top': 50
    },
    {
        duration: speed,
        complete: function(){
            animateUp(this, speed);
        }
    }
    );
};

var animateUp = function(targetElement, speed){
    $(targetElement).animate(
    {
        'top': 0
    },
    {
        duration: speed,
        complete: function(){
            animateDown(this, speed);
        }
    }
    );
};

$(document).ready(function() {
    $("#user_image").hide();

    $(".capture_button").on('click', function() {
        event.preventDefault();
        Osm.GetOsm().RequestPictureAsync(AcceptPictureFromUser, UserDeclinedPicture);
    });

    $("#seconds").on('blur', function() {
        var text = $("#seconds").val();
        text = text.replace(/\D/g,'');
        if (text === "") text = "5";
        console.log("Value: " + text);
        $("#seconds").val(text);
    });

    $(".send_button").on('click', function () {
        // var duration = getDuration();
        var duration = 5;
        var meta = {"pic" : "NO"};
        ShowSpinner('user_image_div');
        Osm.GetBlobApi().RequestEnsureUpload(user_picture.Hash, meta, AttachComplete, AttachFailed);
    });

    $("#send_button").attr('disabled','disabled');
    animateDown($("#default_image"), 2000);

});

function ShowSpinner(on_target) {
    var opts = {
        lines: 13, // The number of lines to draw
        length: 20, // The length of each line
        width: 10, // The line thickness
        radius: 30, // The radius of the inner circle
        corners: 1, // Corner roundness (0..1)
        rotate: 0, // The rotation offset
        direction: 1, // 1: clockwise, -1: counterclockwise
        color: '#ffffff', // #rgb or #rrggbb or array of colors
        speed: 1, // Rounds per second
        trail: 60, // Afterglow percentage
        shadow: false, // Whether to render a shadow
        hwaccel: true, // Whether to use hardware acceleration
        className: 'spinner', // The CSS class to assign to the spinner
        zIndex: 2e9, // The z-index (defaults to 2000000000)
        top: 'auto', // Top position relative to parent in px
        left: 'auto' // Left position relative to parent in px
    };
    var target = document.getElementById(on_target);
    var spinner = new Spinner(opts).spin(target);
}

function getDuration() {
    // return $("#seconds").val();
    return 5;
}

// accepts the picture from the user
function AcceptPictureFromUser(picture) {
    var duration = getDuration();
    var meta = {"pic" : "NO"};
    user_picture = picture;
    console.log("user image url: " + picture.Url);
    $("#title").hide();
    $("#description").hide();
    $("#default_image").hide();
    $("#user_image").show();
    $("#user_image").attr('src', picture.Url);
    $("#showimage_send_button").removeAttr('disabled');
    $("#showimage_send_button").css("background-image", "url(assets/image/send_button.png)");
    $("#showimage_send_button").on("click", function () {
        $(this).css("background-image", "url(assets/image/send_button_active.png)");
    });
}

// user actually didn't want to take snap
function UserDeclinedPicture(reason) {
    console.log("User Declined Picture");
}

function AttachComplete(blob) {
    PushImage(blob);
}

function AttachFailed(reason) {
    alert(reason);
}

function DownloadComplete(picture) {
    console.log("Download Completed");
    // show image in total feed now
}

function DownloadFailed() {
    alert("Download Failed: Image no longer exists");
}

// Pushes a blobbed image
function PushImage(blob) {
    var dur = getDuration();
    console.log("Pushing for duration: " + dur);
    var identities = [];
    var image = [];
    image.push(dur);
    image.push(identities);
    image.push(blob);
    ApplyUpdate(function(o, p) {
        o.playlists = p;
        return o;
    }, image);
    var rdl = TwoPlus.createRDL({
        "noun": "a Snap",
        "displayTitle": "Snap",
        "displayText": "Here comes a Snap! Click to see this Snap for " + getDuration() + " seconds",
        "displayThumbnailUrl": base + "assets/image/snap_icon.png",
        "callback": base + "showImage.html" + "#/docId/" + getNewDocumentReferenceForShowImage(),
    });
    Osm.GetOsm().MakeAvailable(myDoc, function() {alert("Err");}, rdl);
}
