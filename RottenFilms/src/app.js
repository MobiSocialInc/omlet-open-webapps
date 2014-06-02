
// Register for a Rotten Tomatoes API key:
// http://developer.rottentomatoes.com/
var RTApiKey = "vkapn3qvx4wfggyernfhrj6s";
var movies;

function shareMovie(index) {
	// dirty copy
	var movie = JSON.parse(JSON.stringify(movies[index]));
	delete movie.__index;
	
	var rdl = Omlet.createRDL({
    	noun: "movie",
    	displayTitle: movie.title + " | Rotten Tomatoes",
    	displayThumbnailUrl: movie.posters.thumbnail,
    	displayText: movie.synopsis,
    	json: movie,
    	webCallback: movie.links.alternate,
    	callback: window.location.href,
    });

    Omlet.setPasteboard(rdl);
    Omlet.exit();
}

function rtApi(endpoint, callback) {
	var url = "http://api.rottentomatoes.com/api/public/v1.0" + endpoint;
	if (endpoint.indexOf("?") == -1) {
		url += "?apikey=" + RTApiKey;
	} else {
		url += "&apikey=" + RTApiKey;
	}
	$.ajax({
		url:  url,
	    dataType: "jsonp",
	    success: callback
	});
}

Omlet.ready(function() {
	ddx.log("@@@ READY!");
  var movie = Omlet.getPasteboard();
  if (movie) {
	  var template = Handlebars.compile($("#feature-tmpl").html());
	  $("#app").html(template(movie.json));
  } else {
  	ddx.log("@@@ CHECK THE BOX!");
	var template = Handlebars.compile($("#movie-tmpl").html());
    rtApi("/lists/movies/box_office.json?limit=20", function(json) {
    	ddx.log("@@@ GOT SOME FLICKS!");
	  movies = json.movies;
	  $("#app").html("");
      for (i = 0; i < movies.length; i++) {
    	  var movie = movies[i];
    	  movie.__index = i;
    	  $("#app").append(template(movie));
      }
    });
  };
});