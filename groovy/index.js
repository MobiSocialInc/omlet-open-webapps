var API_KEY = /* GET AN API KEY FROM GROOVESHARK */;

/*------------------------------
	makes api call to TinySong for grooveshark music
------------------------------*/
function startSearch(event)
{
	var searchQuery = document.getElementById("songQuery").value;

	var request = 	"http://tinysong.com/s/" +
					searchQuery + 
					"?format=json&limit=5&key=" + API_KEY;

	var obj = 
	{
		AccessURL : request
	}
	ddx.send( "CrossDomainRequest", obj, requestSuccess, requestFail );
}

/*------------------------------
	Event Handler 

	msg = Address with Token
------------------------------*/
function requestSuccess( msg )
{
	parseResult( msg );
}

/*------------------------------
	Event Handler

	msg = Error Message
------------------------------*/
function requestFail( msg )
{
	console.log( msg );
}

/*------------------------------
	request response

	tinysong json:
		Url
		SongID
		SongName
		ArtistID
		ArtistName
		AlbumID
		AlbumName
-------------------------------*/
function parseResult(data)
{
	var jsonString = JSON.stringify(eval("(" + data + ")"));
	var json = JSON.parse( jsonString );

	var resultList = document.getElementById("resultList");
	ClearElementChildren( resultList );

	for( var key in json )
	{
		CreateButtonForElement( 
			resultList, 
			json[key]["SongName"], 
			shareSong, 
			'resultlist-songbutton',
			json[key] );
	}
}

/*------------------------------
	Clear's children of element

	tinysong json:
		Url
		SongID
		SongName
		ArtistID
		ArtistName
		AlbumID
		AlbumName
------------------------------*/
function shareSong( songInfo )
{
	for( var k in songInfo )
	{
		console.log(k + ": " + songInfo[k]);
	}

	var rdl = Omlet.createRDL({
      	noun: "song",
      	displayTitle: songInfo["SongName"],
      	displayThumbnailUrl: "http://sean-apps.s3-website-us-west-2.amazonaws.com/grooveshark/Images/eight_note.png",
      	displayText: "Listen to '" + songInfo["SongName"] + "' by '" + songInfo["ArtistName"] + "' from '" + songInfo["AlbumName"] + "'",
      	json: {},
      	callback: songInfo["Url"],
  	});

  	Omlet.setPasteboard(rdl);
  	Omlet.exit();  
}

/*------------------------------
	Clear's children of element
------------------------------*/
function ClearElementChildren( element )
{
	while( element.hasChildNodes() )
	{
		element.removeChild( element.lastChild );
	}
}

/*------------------------------
	Create a button and add it to the element, handler must have a single argument that takes in a json
	with a song
------------------------------*/
function CreateButtonForElement( parent, buttonID, songHandler, style, songInfo )
{
	var div = document.createElement("div");
	div.className += style;

	var element = document.createElement("input");

	element.setAttribute("type", "Button");
	element.setAttribute("value", buttonID);
	element.setAttribute("name", buttonID);

	element.className += 'button button-block big';	

	element.onclick = function(event) { songHandler(songInfo) };

	div.appendChild( element );
	parent.appendChild( div );
}

/*------------------------------
	taken from: http://cubiq.org/remove-onclick-delay-on-webkit-for-iphone
	this guy is a baus

	To turn an element into one with no click delay, the usage is:
		new NoClickDelay( element );

	Attach function handlers to events like:
		element.addEventListener('touchstart', eventHandler, false);
------------------------------*/
/**  */
function NoClickDelay(el) {
	this.element = el;
	if( window.Touch ) this.element.addEventListener('touchstart', this, false);
}

NoClickDelay.prototype = {
	handleEvent: function(e) {
		switch(e.type) {
			case 'touchstart': this.onTouchStart(e); break;
			case 'touchmove': this.onTouchMove(e); break;
			case 'touchend': this.onTouchEnd(e); break;
		}
	},
	
	onTouchStart: function(e) {
		e.preventDefault();
		this.moved = false;
		
		this.element.addEventListener('touchmove', this, false);
		this.element.addEventListener('touchend', this, false);
	},
	
	onTouchMove: function(e) {
		this.moved = true;
	},
	
	onTouchEnd: function(e) {
		this.element.removeEventListener('touchmove', this, false);
		this.element.removeEventListener('touchend', this, false);

		if( !this.moved ) {
			var theTarget = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
			if(theTarget.nodeType == 3) theTarget = theTarget.parentNode;

			var theEvent = document.createEvent('MouseEvents');
			theEvent.initEvent('click', true, true);
			theTarget.dispatchEvent(theEvent);
		}
	}
};

/*------------------------------
	We make a couple DDX calls, which is how we talk to Omlet.  We just want to make sure is
	is loaded before we make any
------------------------------*/
function checkDDXLoaded()
{
	if( typeof ddx !== 'undefined' )
	{
		var searchButton = document.getElementById('search-button');
		new NoClickDelay( searchButton );

		searchButton.addEventListener('touchstart', startSearch, false );
	}
	else
	{
		window.setTimeout( checkDDXLoaded, 50 );
	}
}

/*------------------------------
	This will be called when the js file loads
------------------------------*/
$(function () 
{
	//-- Ensure ddx is initialized before requesting anything from Omlet
	checkDDXLoaded();
} );