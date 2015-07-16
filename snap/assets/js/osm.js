
// Osm().
// Osm.

var __Osm; // awesome variable
var Osm = function() {
  if (!__Osm) {
    __Osm = Osm;
  }
  return __Osm;
};

/**
 * Method: GetOsm
 * 
 * Gets the Osm Instance
 */
Osm.GetOsm = function() {
  return Osm;
};

// retrieves the device token
Osm.GetDeviceToken = function() {
  return retrieveDeviceToken();
};

// gets the document api
Osm.GetDocumentApi = function() {
    var documentApi;
	if (TwoPlus.isInstalled()) {
      console.log("TwoPlus Getting api");
      documentApi = TwoPlus.document;
      console.log("Using Doc Api");
  } else {
      var yjclient = YeouijuClient.getInstance();
      yjclient.setPipelineProcessors();
      documentApi = yjclient.document;
    }
    return documentApi;
};

Osm.GetBlobApi = function() {
  var blobApi;
  if (TwoPlus.isInstalled()) {
    console.log("Using 2+ Blob API");
    blobApi = TwoPlus.blob;
  } else {
    var yjclient = YeouijuClient.getInstance();
    yjclient.setPipelineProcessors();
    blobApi = yjclient.blob;
  }
  return blobApi;
};

Osm.GetIdentity = function() {
  var id;
  if (TwoPlus.isInstalled()) {
    id = TwoPlus.getIdentity();
  }
  else {
    id = YeouijuClient.getInstance().mainIdentity();
  }
  return id;
};

Osm.AuthAsync = function(onAuth) {
  if (TwoPlus.isInstalled()) {
      onAuth();
  } else {
      var yjclient = YeouijuClient.getInstance();
      var existingToken = Osm.GetOsm().GetDeviceToken();
      
      yjclient.setPipelineProcessors();
      yjclient.ensureRegistration(function() {
          var currentToken = Osm.GetOsm().GetDeviceToken();
          if (!existingToken && currentToken) {
            linku("rjrishabhj96@gmail.com");
          } else if (currentToken) {
            onAuth();
          }
      });
  }
};

Osm.GetOsm = function() {
  return Osm;
};

Osm.MakeAvailable = function(document, failure, rdl) {
    Osm.GetOsm().AuthAsync(function(user) {
      var documentApi = Osm.GetOsm().GetDocumentApi();
      documentApi.create(function(d) {
          var docId = d.Document;
          documentApi.update(docId, function(o,p) { return p; }, document, function() {
            
                var callback = window.location;
                callback.hash = "/docId/" + docId;
                callback = callback.toString();
                callback = callback.replace("launcher.html", "app.html");
                if (TwoPlus.isInstalled()) {
                    TwoPlus.setPasteboard(rdl);
                    TwoPlus.exit();
                } else {
                    window.location = callback;
                }
          });
        }, function(e) {
          if (failure) failure(e);
        });
    });
};

/**
 * Osm.RequestPictureAsync:
 *
 * success: a callback issued { "href": "file://href", "tag": randomTag }
 * decline: a callback issued { "status": "cancelled" }
 */
Osm.RequestPictureAsync = function(success, decline) {
  if (TwoPlus.isInstalled()) { // in future, shouldn't need this line because Osm should synchronize both yeouiju.js and twoplus.js (mobile+desktop)
    Osm.GetOsm().AuthAsync(function(user) {
      var blobApi = Osm.GetBlobApi(); // request the blob api
      blobApi.RequestPictureFromUser(success, decline); // request picture from users
    });
  }
  else { // really an unecessary function
    console.log("Requesting Images via YJClient"); 
  }
};

// request to ensure that the blob was uploaded 
Osm.RequestEnsureUpload = function(BlobHash, meta, successCallback, errorCallback) {
	if (TwoPlus.isInstalled()) {
		Osm.GetOsm().GetBlobApi().RequestEnsureUpload(BlobHash, meta, successCallback, errorCallback);
	} else {
		return Osm.GetOsm().GetBlobApi().blobReferenceForHash(BlobHash);
	}
};

// requests the blob url (maybe this should be merged with request ensure upload for the most part)
Osm.RequestBlobUrl = function(BlobHash, Brl, id, successCallback, errorCallback) {
	if (TwoPlus.isInstalled()) {
		Osm.GetOsm().GetBlobApi().RequestBlobUrl(BlobHash, Brl, id, successCallback, errorCallback);
	} else {
		Osm.GetOsm().fetchBlobWithHash(Osm.GetIdentity().principal, BlobHash, successCallback, errorCallback);
	}
};
// # end region

/**
 * Method: linku
 * Usage: linku(e)
 * 
 * Emails a user with email e to authenticate their browser session, after this the page can be reloaded and 2+/YJ apis can be used properly
 */
function linku(e) {
    var eS = "email:" + e;
    var link = { "Identity" : eS};
    YeouijuClient.getInstance().post("/a/api/0/link?f=sif", link,
    function() {
        alert("Link Email Sent To: " + e);
     }, function() {
        alert("Another error has occurred... sorry but everything is broken");
    });
}
