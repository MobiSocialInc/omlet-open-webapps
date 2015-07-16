var myDoc;
var myDocId;
var functionQueue = [];
var consoleMessages = [];
var found = false;

///////////////////////////////
////// Framework Code /////////
///////////////////////////////

function watchDocument(docref, OnUpdate) {
  documentApi.watch(docref, function(updatedDocRef) {
    if (docref != myDocId) {
      console.log("Wrong document!!");
    } else {
      documentApi.get(docref, OnUpdate);
    }
  }, function(result) {
    var timestamp = result.Expires;
    var expires = timestamp - new Date().getTime();
    var timeout = 0.8 * expires;
    setTimeout(function() {
      watchDocument(docref, OnUpdate);
    }, timeout);
  }, Error);
}

function initDocument() {
  ShowSpinner('base');

  if (TwoPlus.isInstalled()) {
    documentApi = TwoPlus.document;
    _loadDocument();

  } else {
    var yjclient = YeouijuClient.getInstance();
    yjclient.UrlBase = "https://omlet.me";
    yjclient.setPipelineProcessors();
    documentApi = yjclient.document;
    yjclient.ensureRegistration(function() {
      yjclient.syncRealtime();
      _loadDocument();
    }, Error);
  }
}

$(document).ready(function() {
  // $('#showimage_capture_button').hide();
  // $('#showimage_send_button').hide();
  i18n.init(function(t) {
    $('.i18n-text').i18n();
    console.log("");
  });

  $('#back_button').on('click', function() {
    TwoPlus.exit();
  });
  var back_div_width = $('#back_div').width();
  $('#back_div').css('height', back_div_width / 2.92);
  $('#back_div').hide();
  $('#picturesque').hide();
  $('#display_error_div').hide();
});

function hasDocument() {
  var docIdParam = window.location.hash.indexOf("/docId/");
  return (docIdParam != -1);
}

function getDocumentReference() {
  var docIdParam = window.location.hash.indexOf("/docId/");
  console.log("docIdParam: " + docIdParam);
  if (docIdParam === -1) return false;
  console.log("window location: " + window.location.toString());

  var docId = window.location.hash.substring(docIdParam + 7);
  var end = docId.indexOf("/");
  if (end != -1) {
    docId = docId.substring(0, end);
  }
  console.log("docId:" + docId);
  return docId;
}

function getNewDocumentReferenceForShowImage() {
  var docIdParam = window.location.hash.indexOf("/docId/");
  if (docIdParam === -1) return false;
  console.log("window location: " + window.location.toString());

  var docId = window.location.hash.substring(docIdParam + 7);
  var end = docId.indexOf("/");
  if (end != -1) {
    docId = docId.substring(0, end);
  }
  console.log("docId:" + docId);
  return docId;
}

function _loadDocument() {
  if (hasDocument()) {
    myDocId = getDocumentReference();
    documentApi.get(myDocId, ReceiveUpdate);
    watchDocument(myDocId, ReceiveUpdate);
  } else {
    documentApi.create(function(d) {
      console.log("Creating document");
      myDocId = d.Document;
      window.location.hash = "#/docId/" + myDocId;
      documentApi.update(myDocId, function(o, p) {
        return p;
      }, InitialDocument(), function() {
        documentApi.get(myDocId, DocumentCreated);
      });
      watchDocument(myDocId, ReceiveUpdate);
    }, function(e) {
      alert("Error: if desktop then it is a linking error (call linku(\"example@email.com\") via console)" + e);
    });
  }
}

function Error(e) {
  console.error("Eror: " + e);
}

function linku(e) {
  var eS = "email:" + e;
  var link = {
    "Identity": eS
  };
  YeouijuClient.getInstance().UrlBase = "https://omlet.me";
  YeouijuClient.getInstance().post("/a/api/0/link?f=sif", link,
    function() {
      alert("Link Email Sent To: " + e);
    }, function() {
      alert("Another error has occurred... sorry but everything is broken");
    });
}

function sendUpdates() {
  if (functionQueue.length === 0)
    return;

  var p = functionQueue.shift();
  var s = function() {
    sendUpdates();
  };
  var e = function() {
    functionQueue.unshift(p);
    ReceiveUpdate(myDoc);
    setTimeout(sendUpdates, 5000);
  };
  Osm.GetOsm().GetDocumentApi().update(myDocId, p[0], p[1], s, e);
}

// Optimistic apply
function ApplyUpdate(func, params) {
  functionQueue.push([func, params]);
  ReceiveUpdate(myDoc);
  sendUpdates();
}

//////////////////////////////
//// Specfic Document Code ///
//////////////////////////////

function ReceiveUpdate(doc) {
  myDoc = doc;
  for (i = 0; i < functionQueue.length; i++) {
    var t = functionQueue[i];
    t[0](myDoc, t[1]);
  }
  Render(doc);
}

// asks user for the picture via osm library

// Document Created
function DocumentCreated(doc) {
  ReceiveUpdate(doc);
}

// Initial Document
function InitialDocument() {
  var playlist = "";
  var identities = [];
  var times = [];
  return {
    playlists: playlist,
    identities: identities,
    times: times,
  };
}

// Converts a millisecond time to a pretty time stamp
function millisecondsToTime(milli) {
  var seconds = Math.floor((milli / 1000) % 60);
  var minutes = Math.floor((milli / (60 * 1000)) % 60);
  if (seconds < 10) return minutes + ":0" + seconds; // proper formatting
  return minutes + ":" + seconds;
}

// Cleaned up 
function Render(state) {
  console.log("Rendering with state: " + JSON.stringify(state));
  var image = myDoc.playlists;
  var picture = myDoc.playlists[2];
  if (picture) {
    Osm.GetBlobApi().RequestBlobURL(picture.Hash, picture.Brl, "LOL", DownloadComplete, DownloadFailed);
  }
}

function DownloadComplete(file) {
  console.log("Completed Download");
  StopSpinner();

  if (!found) {
    found = true;
    if (inArray(Osm.GetOsm().GetIdentity(), myDoc.identities) === -1) {
      var f = function(o, p) {
        o.identities.push(p);
        return o;
      };
      ApplyUpdate(f, Osm.GetOsm().GetIdentity());
      displayImage(file.Url, myDoc.playlists[0]);
    } else {

      ShowErrorImage();

      // reset();
      // alertify.alert("You've already seen this Snap!", function(e) {
      // TwoPlus.exit();
      // });

    }
  }
}

function ShowErrorImage() {
  $('#bar-title').hide();
  $('#display_error_div').show();
  // $('#default_image_error').show();
  $('#default_image_error').attr("src", "assets/image/snap_error.png");
  $("#header").text("Oops...");
  $('#back_div').show();
}

function DownloadFailed() {
  alert("Failure to Download");
  StopSpinner();
  ShowErrorImage();
}

String.prototype.format = String.prototype.f = function() {
    var s = this,
        i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
};

function displayImage(brl, dur) {
  $('#picturesque').show();
  var f = function(o, p) {
    o.times.push(new Date().getTime());
    return o;
  };
  ApplyUpdate(f, Osm.GetOsm().GetIdentity());
  $("#picturesque").attr('src', brl);
  setTimeout(function() {
    TwoPlus.exit();
  }, dur * 1000);
  var idrdr = setInterval(function() {
    dur--;
    // var countdownText = dur + " seconds left to see this picture";
    var countdownText = $.t("countdown").f(dur);
    $("#header").text(countdownText);
  }, 1000);
}

function inArray(obj, arr) {
  for (var i = 0; i < arr.length; i++) {
    if (JSON.stringify(obj) === JSON.stringify(arr[i])) return i;
  }
  return -1;
}

function getServerEpochTime(success) {
  var doc = {
    Document: myDocId
  };
  console.log("Ret DocID: " + myDocId);
  console.log("Payload: " + JSON.stringify(doc));
  $.ajax({
    type: 'POST',
    url: 'https://omlet.me/a/api/0/document/shared/get',
    data: JSON.stringify(doc),
    success: function(data, textStatus, request) {
      var time = new Date(request.getResponseHeader('Date')).getTime();
      //success(time);
    },
    beforeSend: function(xhr) {
      var deviceToken = retrieveDeviceToken();
      if (deviceToken) {
        xhr.setRequestHeader('Authorization', 'YJ0' + deviceToken);
      }
    },
    error: function(e) {
      console.log("Showing Server Time Error");
      console.warn(e);
    },
    dataType: "json",
    contentType: "application/json; charset=utf-8",
  });
}

function retrieveDeviceToken() {
  if (typeof YeouijuClient != 'undefined' && typeof YeouijuClient.getInstance().DeviceToken == 'string')
    return YeouijuClient.getInstance().DeviceToken;
  return $.cookie("DeviceToken");
}


$(document).ready(function() {
  TwoPlus.ready(function() {
    initDocument();
    //Render();
  });
});
// Initiate the document and renders (Render needed if initDocument already there?