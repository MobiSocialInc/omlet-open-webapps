var refreshUrl = "http://sean-apps.s3-website-us-west-2.amazonaws.com/catgifs/index.html";
var currentImage;

function GetRandomGif(event)
{
	$.ajax({
	 	url: "http://stark-wildwood-7829.herokuapp.com/r/",
	 	context: document.body,
	 	crossDomain: true
	}).done(function( reply ) {
		var pictureDiv = document.getElementById('picture');
	  	pictureDiv.innerHTML = "<img class=\"picture-container\" src=\"" + reply + "\">";
	  	currentImage = reply;
	});
}

function SendGif(event)
{
	var result = confirm("Share gif to feed?");

	if( result )
	{
		console.log("Attempting to send!");
		var obj = { "type" : "animatedGif", "data":{"imageUrl" : currentImage }};
		Omlet.exit(obj);
	}
}

function SetUpRefresh()
{
	var refreshDiv = document.getElementById('refresh-button');

	new NoClickDelay( refreshDiv );
	refreshDiv.addEventListener('touchstart', GetRandomGif, false );
}

function SetUpShare()
{
	var shareLabel = document.getElementById('share-label');
	shareLabel.innerHTML = "Share";
	console.log("Sharing gif!");

	var shareDiv = document.getElementById('share-button');

	new NoClickDelay( shareDiv );
	shareDiv.addEventListener('touchstart', SendGif, false );
}

/*------------------------------
	taken from: http://cubiq.org/remove-onclick-delay-on-webkit-for-iphone
	this guy is a baus

	To turn an element into one with no click delay, the usage is:
		new NoClickDelay( element );

	Attach function handlers to events like:
		element.addEventListener('touchstart', eventHandler, false);
------------------------------*/
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
	This will be called when the js file loads
------------------------------*/
$(function () 
{
	SetUpRefresh();
	SetUpShare();
	GetRandomGif();
} );