//////////////////////////////
///// Application Code ///////
//////////////////////////////


var responseCount = 0;


function sharePoll() {
    if($('textarea#question').val().length == 0) {
        alert("Write a question!");
        return;
    }
    var count = 0;
    var responses = [];
    for(var i = 0; i < responseCount; i++) {
        var response = $('input[id=answer'+i+']').val();
        if(response.length > 0) {
            responses.push(response);
            count++;
        }
    }
    if(count == 0) {
        alert("Put an option!");
        return;
    }

    var poll = {
        question : $('textarea#question').val()
    }
    poll["responses"] = JSON.stringify(responses);

    var html = '<script>var pendingObj = [];';

    for(var i = 0; i < count; i++) {
        var pendingObj = {
            "Type":"app",
            "noun":"poll response",
            "displayTitle":"WatchPoll",
            "displayText":"I voted for: " + responses[i],
            "json": poll,
            "callback": encodeURI(window.location.href)
        };
        html += 'pendingObj.push ('+JSON.stringify(pendingObj)+');';
    }
    html += '</script><div style="width: 100%; margin-top: 8px; color: #e1bd83; text-align: center; font-size: 28px;">'+poll.question+'</div>';

    for(var i = 0; i < count; i++) {

        html += '<div style="font-size: 30px; background: #53575c; line-height: 60px; width: 290px; height: 60px; margin-left: auto; margin-right: auto; margin-top: 10px; text-align: center; font-size: 34px;" onclick="Omlet.sendObj(pendingObj['+i+'].Type, pendingObj['+i+']);">'+responses[i]+'</div>';
    }
    var rdl = Omlet.createRDL({
        noun: "poll",
        displayTitle: "WatchPoll",
        displayThumbnailUrl: "http://dhorh0z3k6ro7.cloudfront.net/apps/quikpoll/images/quikpoll.png",
        displayText: poll.question,
        json: poll,
        displayHtmlSmall: html,
        callback: encodeURI(window.location.href)
    });
    Omlet.exit(rdl);
}

function functionForResponse(response, poll) {

    return function() {
        var rdl = Omlet.createRDL({
                noun: "poll response",
                displayTitle: "WatchPoll",
                displayText: "I voted for: " + JSON.parse(poll.responses)[response],
                json: poll,
                callback: encodeURI(window.location.href)
            });
        Omlet.exit(rdl);

    };
}


/***************************************/



//add additional response fields to the ui
function addResponse() {
    var option = String.fromCharCode(65 + responseCount);
    $("#responses").append('<p>Option ' + option + '</p><input id="answer'+responseCount+'" class="form_format" type="text">');
    responseCount++;
}


//show the poll form
function ShowQuestionForm(poll) {
    var responses = JSON.parse(poll.json.responses);

    var poll_question = poll.json.question.replace(/\r\n|\r|\n/g,'<br>');
    //alert(poll_question);
    $("#app").html("");
    $("#app").append('<div id="poll_question">'+poll_question+'</div>');  

    for(var i = 0; i < responses.length; i++) {
            var letter = String.fromCharCode(65 + i);
            $("#app").append('<div class="poll_answer" id="submitquestion'+i+'">'+letter+': ' + responses[i] + '</div>');
            $("#submitquestion"+i).fastClick(functionForResponse(i, poll.json));
    }
    $("#app").append('<img src="images/EGG-2.png" class="omlet_second"></img>');

}

//show the poll creation form
function ShowEmptyQuestionForm() {

    $("#app").html("");
    $("#app").append('<img src="images/EGG-1.png" class="omlet_first"></img><p>Question:</p><div><textarea class="form_format" style="height:90px;" id="question"></textarea></div><div id="responses"></div><div id="moreResponses"><img src="images/option.png" weight="270px" height="32px"></img> </div><div id="submit">Create</div></div>');
    addResponse();
    addResponse();

    
    $("#moreResponses").fastClick(addResponse);
    $("#submit").fastClick(sharePoll);
}

//this is the entry point to your app, and is called by 2plus when it has finished loading it's stuff
Omlet.ready(function() {
    var poll = Omlet.getPasteboard();

    if(poll) {
        ShowQuestionForm(poll);
    }

    else {
        ShowEmptyQuestionForm();
    }
});

