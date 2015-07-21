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
  if (TwoPlus.isInstalled()) {
    documentApi = TwoPlus.document;
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
      documentApi.update(myDocId, Initialize, InitialDocument(), function() {
        documentApi.get(myDocId, DocumentCreated);
      }, function(e) {
        alert("error: " + JSON.stringify(e));
      });
      watchDocument(myDocId, ReceiveUpdate);
    }, function(e) {
      alert("error: " + JSON.stringify(e));
    });
  }
}

//////////////////////////////
///// Application Code ///////
//////////////////////////////


var responseCount = 0;
var showingResults = false;



/*** Call back methods that get passed to 2plus update method for updating the doc ***/

//First time we call update, we're just initializing the doc to the params that are passed in
//we shouldn't have to do this in the future when we fix up the api
function Initialize(old, params) {
    return params;
}

//Any other time we call update, we're not passing in the full doc, just a set of params
//for updating the old doc
function Update(old, params) {
    old.pollCounts[params["option"]]++;
    var time = new Date().getTime();
    old.voters[params.voter.principal] = {"name":params.voter.name, "vote":params["option"], "time":time};
    return old;
};
/***************************************/




//Set up what the doc looks like with some default values
function InitialDocument() {
    var poll = {
        question : $('textarea#question').val()
    }
    
    var count = 0;
    var pollCounts = [];
    var responses = [];
    for(var i = 0; i < responseCount; i++) {
        var response = $('input[id=answer'+i+']').val();
        if(response.length > 0) {
            poll['response'+count] = response;
            pollCounts[count] = 0;
            responses.push(response);
            count++;
        }
    }
    poll["responses"] = JSON.stringify(responses);
    
    var initValues = {
        'creator':TwoPlus.getIdentity(), 
        'pollCounts':pollCounts, 
        'voters':{},
        'poll': poll
    };
    return initValues;
}

//After the doc has been created, create a Rich Deep Link(RDL) and post it back to 2plus chat
//...unless you're in a browser.
function DocumentCreated(doc) {
	//alert(JSON.stringify(doc.poll));
    var quikpoll = i18n.t("QuikPoll");
    if(TwoPlus.isInstalled()) {
        var rdl = TwoPlus.createRDL({
        		appName: "QuikPoll",
                noun: "poll",
                displayTitle: quikpoll,
                displayThumbnailUrl: "https://dhorh0z3k6ro7.cloudfront.net/apps/quikpoll/images/quikpoll.png",
                displayText: doc.poll.question,  
                json: doc.poll,
                webCallback: "https://dhorh0z3k6ro7.cloudfront.net/apps/quikpoll/index.html",
                callback: encodeURI(window.location.href)
            });
        TwoPlus.setPasteboard(rdl);
        TwoPlus.exit();
    }
    else {
        ReceiveUpdate(doc);
    }

}


//Check if the user has set a question and has at least 1 response option
//Then kick off the doc creation process
function sharePoll() {
    var need_write_q = i18n.t("Need_write_question");
    var need_write_o = i18n.t("Need_write_option");
    if($('textarea#question').val().length == 0) {
        alert(need_write_q);
        return;
    }
	var count = 0;
    for(var i = 0; i < responseCount; i++) {
        var response = $('input[id=answer'+i+']').val();
        if(response.length > 0) {
            count++;
        }
    }
	if(count == 0) {
	    alert(need_write_o);
	    return;
    }
    initDocument();
	
}


/*** woo lexical scoping. ***/

//get a function to bind to each response option for when user taps on it
//after user selects response, show the results along with a message saying what the voted for
//if it seems that they've already voted and somehow bypassed the ui, just show what their
//original vote was
function functionForResponse(response) {

    return function() {
      //var voter_text = i18n.t("Voter");
      //var option = i18n.t("Option");
    	if(TwoPlus.getIdentity().principal in myDoc.voters) {
	        var voter = myDoc.voters[TwoPlus.getIdentity().principal];
	        showPollResults(voter.vote);
	    }
        else {
            documentApi.update(myDocId, Update, { "option":response, "voter":TwoPlus.getIdentity() }, ReceiveUpdate);
        
            showPollResults(response);
        }
    };
}

//get a function to bind to each results bar
//tapping on the bar shows a list of who voted for it
function getToggleFunction(i) {
    return function() {
        if($("#voter_list_"+i).css('display') == "none") {
            $("#voter_list_"+i).slideDown('slow', function() {
                // Animation complete.
              });
        }
        else {
            $("#voter_list_"+i).slideUp('slow', function() {
                // Animation complete.
              });
        }
    }
}

/***************************************/



//update the results page, with some cute animating bars
//this gets called from the update callback method that was passed to 2plus
function updateResults() {
	var pollCounts = myDoc.pollCounts;

  var response_text = i18n.t("Response");
  var responses_text = i18n.t("Responses");  
	var totalVotes = 0;
	for(var i = 0; i < pollCounts.length; i++) {
	    totalVotes += pollCounts[i];
    }
	
    var responseString = (totalVotes == 1) ? response_text : responses_text;	
    //var responseString = (totalVotes == 1) ? "response" : "responses";
    $("#poll_count").text(totalVotes+' '+responseString);
	
	for(var i = 0; i < pollCounts.length; i++) {
        var percent = pollCounts[i] / totalVotes;
        var newWidth = (percent > 0) ?percent * 200 : 1;
        $("#result_bar_"+i).animate({
            width:newWidth
        }, 300);
        
        $("#voter_list_"+i).html("");
        $("#result_count_"+i).html(pollCounts[i]);
        
        for(var principal in myDoc.voters) {
            var voter = myDoc.voters[principal];
            if(voter.vote == i) {
                $("#voter_list_"+i).append('<div class="voter_list_entry">'+voter.name+'</div>');   
            }
        }
    
    }
}

//show the results without having to vote
function showJustPollResults() {

	var pollCounts = myDoc.pollCounts;
  var response_text = i18n.t("Response");
  var responses_text = i18n.t("Responses");
  var poll_result = i18n.t("Poll_results");
	var totalVotes = 0;
	for(var i = 0; i < pollCounts.length; i++) {
	    totalVotes += pollCounts[i];
    }
    var poll_question = myDoc.poll.question.replace(/\r\n|\r|\n/g,'<br>');
    var responseString = (totalVotes == 1) ? response_text : responses_text;
    
	$("#app").html("");
	$("#app").append('<div id="poll_question">'+poll_question+'</div>'+poll_result+' : (<span id="poll_count">'+totalVotes+' '+responseString+'</span>)');
    
	for(var i = 0; i < pollCounts.length; i++) {
        var response = myDoc.poll['response'+i];
        
        var letter = String.fromCharCode(65 + i);
        var percent = pollCounts[i] / totalVotes;
        var width = (percent > 0) ? percent * 200 : 1;
            
        $("#app").append('<div class="result_row" id="result_row_'+i+'"><div class="result_option">'+letter+':</div><div class="result_bar" id="result_bar_'+i+'" style="width:'+width+'"></div><div class="result_count" id="result_count_'+i+'">' + pollCounts[i] + '</div><div class="clear"></div><div class="result_answer">'+response+'</div></div>');
    
        $("#app").append('<div class="voter_list" id="voter_list_'+i+'"></div>');
        
        var toggleFunction = getToggleFunction(i);
        $("#result_row_"+i).fastClick(toggleFunction);
        
        for(var principal in myDoc.voters) {
            var voter = myDoc.voters[principal];
            if(voter.vote == i) {
                $("#voter_list_"+i).append('<div class="voter_list_entry">'+voter.name+'</div>');   
            }
        }
    }
    
    showingResults = true;
}

//show the results after having voted
function showPollResults(response) { 
    var answer = myDoc.poll['response'+response];
    var answerLetter = String.fromCharCode(65 + response);
    
	var pollCounts = myDoc.pollCounts;
	var response_text = i18n.t("Response");
  var responses_text = i18n.t("Responses");
  var share_vote = i18n.t("Share_vote");
  var you_vote = i18n.t("You_vote");
  var poll_result = i18n.t("Poll_results");
  var quickpoll_response = i18n.t("QuickPoll_response");
  var i_vote = i18n.t("I_vote");
  var poll_response_text = i18n.t("Poll_response");
  //var ks = myDoc.poll.question.val().split("\n");
  var poll_question = myDoc.poll.question.replace(/\r\n|\r|\n/g,'<br>');
  //alert(poll_question);


  var totalVotes = 0;
	for(var i = 0; i < pollCounts.length; i++) {
	    totalVotes += pollCounts[i];
    }

    
    var responseString = (totalVotes == 1) ? response_text : responses_text;
    
	$("#app").html("");
	$("#app").append('<img src="images/EGG-3.png" class="omlet_third"></img><div id="poll_question">'+poll_question+'</div>');
	
	for(var i = 0; i < pollCounts.length; i++) {
        var response = myDoc.poll['response'+i];
        
        var letter = String.fromCharCode(65 + i);
        var percent = pollCounts[i] / totalVotes;
        var width = (percent > 0) ? percent * 200 : 1;
    
        if(myDoc.creator.principal == TwoPlus.getIdentity().principal) {
            
            $("#app").append('<div class="result_row" id="result_row_'+i+'"><div class="result_option">'+letter+' </div><div class="result_bar" id="result_bar_'+i+'" style="width:'+width+'"></div><div class="result_count" id="result_count_'+i+'">' + pollCounts[i] + '</div><div class="clear"></div><div class="result_answer">'+response+'</div></div>');

            $("#app").append('<div class="voter_list" id="voter_list_'+i+'"></div>');
            
            var toggleFunction = getToggleFunction(i);
            $("#result_row_"+i).fastClick(toggleFunction);
            
            for(var principal in myDoc.voters) {
                var voter = myDoc.voters[principal];
                if(voter.vote == i) {
                    $("#voter_list_"+i).append('<div class="voter_list_entry">'+voter.name+'</div>');   
                }
            }
             
        }
        else {
            $("#app").append('<div class="result_row"><div class="result_option">'+letter+':</div><div class="result_bar" style="width:'+width+'"></div><div class="result_count" id="result_count_'+i+'">' + pollCounts[i] + '</div><div class="clear"></div><div class="result_answer">'+response+'</div></div>');
        }
    }
	
    $("#app").append('<div id="poll_your_response">'+ you_vote + ' ' + answerLetter + ': ' + answer + '<br>' + poll_result + ': <span id="poll_count">' + totalVotes + ' ' + responseString + '</span></div>');
    $("#app").append('<div id="share">'+share_vote+'</div>');
    var share = function() {
        var rdl = TwoPlus.createRDL({
    			noun: poll_response_text,
    			displayTitle: quickpoll_response,
    			displayThumbnailUrl: "http://dhorh0z3k6ro7.cloudfront.net/apps/quikpoll/images/quikpoll.png",
    			displayText: i_vote + ": " + answer,
    			callback: encodeURI(window.location.href)
    		});
    	TwoPlus.setPasteboard(rdl);
    	TwoPlus.exit();
    }       
    $("#share").fastClick(share);
    
    showingResults = true;
}

//add additional response fields to the ui
function addResponse() {
    var option = String.fromCharCode(65 + responseCount);
    option_text = i18n.t('Option');
    $("#responses").append('<p>'+option_text+' ' + option + '</p><input id="answer'+responseCount+'" class="form_format" type="text">');
    responseCount++;
}

//update callback method that is passed to 2plus when you start "watching" the doc for changes
function ReceiveUpdate(doc) {
    myDoc = doc;

    if(showingResults) {
        updateResults();
    }
    else {
        if(TwoPlus.getIdentity().principal in myDoc.voters) {
            showPollResults(myDoc.voters[TwoPlus.getIdentity().principal].vote);
        }
        else {
            ShowQuestionForm();
        }
    }
}

//show the poll form
function ShowQuestionForm() {
    
    var poll_question = myDoc.poll.question.replace(/\r\n|\r|\n/g,'<br>');
    //alert(poll_question);
    $("#app").html("");
    $("#app").append('<div id="poll_question">'+poll_question+'</div>');  

    for(var i = 0; i < myDoc.pollCounts.length; i++) {
            var letter = String.fromCharCode(65 + i);
            $("#app").append('<div class="poll_answer" id="submitquestion'+i+'">'+letter+': ' + myDoc.poll['response'+i] + '</div>');
            $("#submitquestion"+i).fastClick(functionForResponse(i));
    }
    $("#app").append('<img src="images/EGG-2.png" class="omlet_second"></img>');

}

//show the poll creation form
function ShowEmptyQuestionForm() {

    var question = i18n.t('Question'); 
    var create = i18n.t('Create');
    $("#app").html("");
    $("#app").append('<img src="images/EGG-1.png" class="omlet_first"></img><p>'+question+':</p><div><textarea class="form_format" style="height:90px;" id="question"></textarea></div><div id="responses"></div><div id="moreResponses"><img src="images/option.png" weight="270px" height="32px"></img> </div><div id="submit">'+create+'</div></div>');
    addResponse();
    addResponse();

    
    $("#moreResponses").fastClick(addResponse);
    $("#submit").fastClick(sharePoll);
}

//this is the entry point to your app, and is called by 2plus when it has finished loading it's stuff
TwoPlus.ready(function() {

    i18n.init(function(t) { 
      $('.i18n-text').i18n();
      if (hasDocument()) {
        initDocument();
      }
      else {
        ShowEmptyQuestionForm();
      }
    });
});

