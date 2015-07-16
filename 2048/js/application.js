// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  new GameManager(4, KeyboardInputManager, HTMLActuator, LocalScoreManager);

  //-- Ensure ddx is initialized before requesting anything from Omlet
  checkDDXLoaded();
});

/*------------------------------
	We make a couple DDX calls, which is how we talk to Omlet.  We just want to make sure is
	is loaded before we make any
------------------------------*/
function checkDDXLoaded()
{
	if( typeof ddx !== 'undefined' )
	{
		ddx.send( "WarnOnExit" );
	}
	else
	{
		window.setTimeout( checkDDXLoaded, 50 );
	}
}
