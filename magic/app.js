/**
 * Game Counter is a prototype document-driven app.
 */

//////////////////////////////
///// Framework Code ///////
//////////////////////////////

var documentApi;
var myDoc;
var myDocId;

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
  if (Omlet.isInstalled()) {
    documentApi = Omlet.document;
    _loadDocument();
  } else {
    var yjclient = YeouijuClient.getInstance();
    yjclient.setPipelineProcessors();
    documentApi = yjclient.document;
    yjclient.ensureRegistration(function() {
      yjclient.syncRealtime();
      _loadDocument();
    }, Error);
  }
}

function hasDocument() {
	var docIdParam = window.location.hash.indexOf("/docId/");
 	return (docIdParam != -1);
}

function getDocumentReference() {
	var docIdParam = window.location.hash.indexOf("/docId/");
	if (docIdParam == -1) return false;
	var docId = window.location.hash.substring(docIdParam+7);
    var end = docId.indexOf("/");
    if (end != -1) {
      docId = docId.substring(0, end);
    }
    return docId;
}

function _loadDocument() {
  if (hasDocument()) {
    myDocId = getDocumentReference();
    documentApi.get(myDocId, ReceiveUpdate);
    watchDocument(myDocId, ReceiveUpdate);
  } else {
    documentApi.create(function(d) {
      myDocId = d.Document;
      location.hash = "#/docId/" + myDocId;
      documentApi.update(myDocId, function(o,p){return p},  InitialDocument(), function() {
        documentApi.get(myDocId, DocumentCreated);
      });
      watchDocument(myDocId, ReceiveUpdate);
    }, function(e) {
      alert("error" + e);
    });
  }
}


//Assumes idempotency!
function ApplyUpdate(params) {
  Update(myDoc, params);
  ReceiveUpdate(myDoc);
	documentApi.update(myDocId, Update, params, function() {}, function(e) {});
}


//////////////////////////////
///// Application Code ///////
//////////////////////////////

function Error(e) {
  alert("Error!");
}

function Update(doc, params) {
  doc.life[params.player] = doc.life[params.player] + params.amount;
  return doc;
}

var numPlayers;

function InitialDocument() {
	var initialLife = [];
	for (i = 0; i < numPlayers; i++) {
		initialLife.push(20);
	}

	return {
  	  life: initialLife
    };
}

function DocumentCreated(doc) {
	if (Omlet.isInstalled()) {
		var rdl = Omlet.createRDL({
			"noun": "MTG Counter",
			"displayTitle": "MTG Counter",
			"displayThumbnailUrl": "http://upload.wikimedia.org/wikipedia/en/a/aa/Magic_the_gathering-card_back.jpg",
			"displayText": "Click to join the game counter!",
			"callback": window.location.href,
		});
		Omlet.setPasteboard(rdl);
		Omlet.exit();
	} else {
		ReceiveUpdate(doc);
	}
}

function ReceiveUpdate(doc) {
  myDoc = doc;
  Render(doc);
}

function Render(state) {
  var html = "<div class='player'>";
  for (i = 0; i < state.life.length; i++) {
    var cname = "tile_" + i;
    html += "<input class='player' id='"+cname+"' type='text' value='" + state.life[i] + "'/>";
    html += "<button onclick='IncrementCounter(" + i + ",-1)'>-</button>";
    html += "<button onclick='IncrementCounter(" + i + ", 1)'>+</button>";
    html += "<br/>";
  }
  html += "</div>";
  $("#app").html(html);
}

function StartGame(players) {
	numPlayers = players;
	initDocument();
}

function IncrementCounter(player, amount) {
	ApplyUpdate({ "player" : player, "amount" : amount });
}

function ShowSettings() {
	$("#app").html($("#settings_template").html());
}

Omlet.ready(function() {
  // Use this to link an account to your browser's device token for development purposes.
  /*
  var link = { "Identity" : "email:YOUR_EMAIL_HERE@gmail.com"};
  YeouijuClient.getInstance().post("/a/api/0/link?f=sif", link,
  function() {
    alert("Yay! we sent an email to get this account linked");
  }, function() {
    alert("Booo! We failed to link the account.");
  });
  */

  if (hasDocument()) {
  	initDocument();
  } else {
  	ShowSettings();
  }
});