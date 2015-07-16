var base = "https://dhorh0z3k6ro7.cloudfront.net/apps/snap/"
var user_picture;
var second_duration = 5;
var send_image_active_preload;

/*
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
}; */

$(document).ready(function() {
    i18n.init(function(t) {
        $('.i18n-text').i18n();
    });

    $("#second_selector").hide();
    $("#user_image").hide();

    $(".capture_button").on('click', function() {
        event.preventDefault();
        Osm.GetOsm().RequestPictureAsync(AcceptPictureFromUser, UserDeclinedPicture);
    });

    $("#send_button").attr('disabled', 'disabled');
    send_image_active_preload = new Image();
    send_image_active_preload.src = 'assets/image/send_button_active.png';


    // animateDown($("#default_image"), 2000);

});

function updateRange(val) {
    second_duration = val;
    $("#second_text").text(val);
}

function getDuration() {
    // return $("#seconds").val();
    return second_duration;
}

// accepts the picture from the user
function AcceptPictureFromUser(picture) {
    var duration = getDuration();
    var meta = {
        "pic": "NO"
    };
    user_picture = picture;
    console.log("user image url: " + picture.Url);
    $("#title").hide();
    $("#description").hide();
    $("#default_image").hide();
    $("#second_selector").show();
    $("#user_image").attr('src', picture.Url);
    $("#user_image").show();

    $(".send_button").on('click', function() {
        // var duration = getDuration();
        // var duration = 5;
        var meta = {
            "pic": "NO"
        };
        ShowSpinner('user_image_div');
        Osm.GetBlobApi().RequestEnsureUpload(user_picture.Hash, meta, AttachComplete, AttachFailed);
    });

    $("#send_button").removeAttr('disabled');
	$("#send_button_img").attr("src", "assets/image/send_button_img.png");
    $("#send_button").css("background", "#49adfd");
	$("#send_button").css("border-color", "#009ce0");
	$("#send_button").css("border-style", "groove");
    $("#send_button").on("click", function() {
        $(this).css("background-image", send_image_active_preload.src);
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
    var dur = second_duration;
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
        "displayText": $.t("rdl-displaytext") + second_duration + " " + $.t("rdl-displaytext-second"),
        "displayThumbnailUrl": base + "assets/image/snap_icon.png",
        "callback": base + "showImage.html" + "#/docId/" + getDocumentReference(),
    });
    Osm.GetOsm().MakeAvailable(myDoc, function() {
        alert("Err");
    }, rdl);
}