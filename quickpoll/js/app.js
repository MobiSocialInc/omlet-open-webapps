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
    for(var i = 0; i < responseCount; i++) {
        var response = $('input[id=answer'+i+']').val();
        if(response.length > 0) {
            poll['response'+count] = response;
            pollCounts[count] = 0;
            count++;
        }
    }
    
    var initValues = {
        'creator':Omlet.getIdentity(), 
        'pollCounts':pollCounts, 
        'voters':{},
        'poll': poll
    };
    return initValues;
}

//After the doc has been created, create a Rich Deep Link(RDL) and post it back to 2plus chat
//...unless you're in a browser.
function DocumentCreated(doc) {
    
    var quikpoll = i18n.t("QuikPoll");
    if(Omlet.isInstalled()) {

        var html = '<script>var pendingObj = [];';
        for(var i = 0; i < doc.pollCounts.length; i++) {
            var pendingObj = {
                "Type":"app",
                "noun":"poll response",
                "displayTitle":"WatchPoll",
                "displayText":"I voted for: " + doc.poll['response'+i],
                "callback": encodeURI(window.location.href)
            };
            html += 'pendingObj.push ('+JSON.stringify(pendingObj)+');';
        }
        html += '</script><div style="width: 100%; border-bottom: 1px solid black; text-align: center; font-size: 30px;">'+doc.poll.question+'</div>';

        for(var i = 0; i < doc.pollCounts.length; i++) {

            html += '<div style="font-size: 30px; line-height: 75px; width: 290px; height: 75px; margin-left: auto; margin-right: auto; margin-top: 20px; text-align: center; border: 1px solid black; border-radius: 15px;" onclick="Omlet.sendObj(pendingObj['+i+'].Type, pendingObj['+i+']);">'+doc.poll['response'+i]+'</div>';
        }

        var rdl = Omlet.createRDL({
                noun: "poll",
                displayTitle: quikpoll,
                displayThumbnailUrl: "http://dhorh0z3k6ro7.cloudfront.net/apps/quikpoll/images/quikpoll.png",
                displayText: doc.poll.question,
                displayHtmlSmall: html,
                callback: encodeURI(window.location.href)
            });
        Omlet.setPasteboard(rdl);
        Omlet.exit();
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
        var rdl = Omlet.createRDL({
                noun: "poll response",
                displayTitle: "WatchPoll",
                displayText: "I voted for: " + myDoc.poll['response'+response],
                callback: encodeURI(window.location.href)
            });
        Omlet.setPasteboard(rdl);
        Omlet.exit();

    };
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

    ShowQuestionForm();
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
Omlet.ready(function() {

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

