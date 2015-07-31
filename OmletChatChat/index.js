var DEFAULT_TEXT = "";

var USER_IDENTITY = "Default User"

var chatModel = {
	'messages': []
};

/**
 *  The ShareDocumentAPI() is just a wrapper around Omlet JS's document api.
 */
function SharedDocumentAPI() {
	this.document = null;
	this.documentId = null;
}

/**
 *	To be called before making an Update call to the Shared Document.  
 *
 *  The input, clientUpdateHandler should be a callback that accepts the Shared Document as 
 *  an argument.  This will be attached to the shared document and called whenever an update
 *  to the shared document occurs
 */
SharedDocumentAPI.prototype.InitDocument = function(clientUpdateHandler) {
	//-- get the document object from the OmletJS
	if( Omlet.isInstalled() && Omlet.document ) {
		this.document = Omlet.document;
	}	

	if( this.document == null ) {
		return;	
	}

	//-- A persistant documentID can be stored in many ways.  Retrieve it before calling
	//-- InitDocument and store it in this.documentId.  If this.documentId is still null,
	//-- then we will create a new document id
	if( this.documentId == null ) {

		this.document.create(

			function(successResult) {
				this.documentId = successResult.Document;

				//-- listen to future changes in the document
				this.WatchDocument( clientUpdateHandler );
			}.bind(this),

			function(errorResult) {
			}

		);
	}
	else {
		//-- we should only get here if we have a pre-existing document id

		//-- retrieve all information currently stored in the shared document
		this.document.get( this.documentId, clientUpdateHandler );

		//-- listen to future changes in the document
		this.WatchDocument( clientUpdateHandler );
	}
}

/**
 *	clientUpdateHandler should be a callback that takes in the sharedDocument as an argument.
 *  You can attach additional handler functions using WatchDocument.
 */
SharedDocumentAPI.prototype.WatchDocument = function(clientUpdateHandler) {

	this.document.watch( this.documentId,
		
		//-- anytime there is an update, this will be called
		function( updateResponse ) {

			//-- we will just pull all the data on the shared document and let the client handle the processing
			this.document.get( this.documentId, clientUpdateHandler );

		}.bind(this),

		//-- this will be called if we successfully watch the document
		function( successResponse ) {

		}.bind(this),

		//-- this will be called if there is an error when trying to watch the document
		function( errorResponse ) {
		
		}	

	);	
}

/**
 *  When the client wants to make an update to the shared document, you can call this function.  
 *
 *  docTransformFunc will be the function that Omlet will run to transform any data within the document.
 *
 *  updateModel will be the data that will be passed to the transform function.  How you modify the document
 *  with this input data should be implemented in docTransformFunc
 *
 *  clientUpdateHandler should be a callback that takes the sharedDocument as an argument.  It will be called
 *  when a change occurs as a result of this update
 */
SharedDocumentAPI.prototype.UpdateDocument = function(docTransformFunc, updateModel, clientUpdateHandler) {
	this.document.update( 
		this.documentId, 
		docTransformFunc, 
		updateModel,
		clientUpdateHandler,

		function( errorResponse ) {
		}
	);
}

var sharedDocument = new SharedDocumentAPI();

//--  Do not make calls to other functions you might have!
//--  Try to only do writes in this function.  Any heavy processing should be done outside of this function
function DocTransformer(doc, params) {

	return params;
}

function Update(document) {
	if( document["messages"] ) {
		chatModel["messages"] = document["messages"];
		
		ClearMessages();
		RenderMessages();
	}
}

//--------------------
//-- Client Functions
//--------------------

function AddMessage(sender, message) {
	var msg = {};
	msg.sender = sender;
	msg.message = message;

	var messages = chatModel["messages"];
	messages[messages.length] = msg;
}

function ClearMessages() {
	var msgContainer = document.getElementById("messages-container");
	msgContainer.innerHTML = "";
}

function RenderMessages() {
	var msgContainer = document.getElementById("messages-container");

	var i;
	var messages = chatModel["messages"];

	for( i = 0; i < messages.length; i++ ) {
		msgContainer.innerHTML += 
			messages[i].sender + ": " +
			messages[i].message + "<br>";
	}
}

function SetUpSendButton() {
	var sendButton = document.getElementById("send-button");
	FastClick.attach(sendButton);

	sendButton.addEventListener('click', function(event) {
		var textInput = document.getElementById("text-entry");
		var msg = textInput.value;

		AddMessage(USER_IDENTITY, msg);

		textInput.value = DEFAULT_TEXT;

		sharedDocument.UpdateDocument(DocTransformer, chatModel, Update);
	});
}

function SetUpShareButton() {
	var shareButton = document.getElementById("share-button");
	FastClick.attach(shareButton);

	shareButton.addEventListener('click', function(event) {
		if(Omlet.isInstalled()) {
	        var rdl = Omlet.createRDL({
	        		appName: "Omlet Chat Chat",
	                noun: "chat chat",
	                displayTitle: "Omlet Chat Chat",
	                displayText: "Dawg",  
	                json: {"docId": sharedDocument.documentId },
	                webCallback: "https://sean-apps.s3.amazonaws.com/omirc/index.html",
	                callback: encodeURI(window.location.href)
        	});

	        Omlet.setPasteboard(rdl);
	        Omlet.exit();
    	}
	});
}

function SetUpButtons() {
	SetUpSendButton();
	SetUpShareButton();
}

function SetUpOmletIdentity() {

	if( Omlet.getIdentity() && Omlet.getIdentity().name != null )
		USER_IDENTITY = Omlet.getIdentity().name;

}

function SetUpShareDocumentAPI() {
	TryGetDocumentId();

	sharedDocument.InitDocument(Update);
}

//-- this app might be launched through an RDL in Omlet.  If so, I stored the docId in 
//-- the json parameter in the shareButton handler.  Use the docId in the RDL to get the 
//-- correct shared document
function TryGetDocumentId() {
	if( Omlet.getPasteboard() ) {
		sharedDocument.documentId = Omlet.getPasteboard().json["docId"];
	}
}

$(function() {
	console.log("=====================================");
});

//-- This will be called when OmletJS is initialized
Omlet.ready(function() {
	SetUpOmletIdentity();
	SetUpShareDocumentAPI();

	SetUpButtons();
});