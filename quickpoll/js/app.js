//keep track of how many response fields there are in the form
var responseCount = 0;

//share the poll back to the chat
function sharePoll() {

    //make sure there's a question
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

    //make sure at least one response is filled out
    if(count == 0) {
        alert("Put an option!");
        return;
    }

    //start building up the JSON for the poll obj that we want to put back into the chat
    var poll = {
        question : $('textarea#question').val()
    }
    poll["responses"] = JSON.stringify(responses);


    /* we're going to build up some html that's going to be rendered on the watch
     *
     * we create an array of pending objects in a script tag at the top of the html
     * in the UI part of the html, when someone taps on an option, we send the corresponding
     * pendingObj back into the chat
     */
    var html = '<script>var pendingObj = [];';

    for(var i = 0; i < count; i++) {
        var pendingObj = {
            "Type":"app",
            "noun":"a poll response",
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

    //time to package up the poll JSON and the HTML into the RDL and ship it to Omlet
    var rdl = Omlet.createRDL({
        noun: "a poll",
        displayTitle: "WatchPoll",
        displayThumbnailUrl: "http://ian-apps.s3-website-us-east-1.amazonaws.com/quikpoll/images/watchpoll.png",
        displayText: poll.question,
        json: poll,
        displayHtmlSmall: html,
        callback: encodeURI(window.location.href)
    });
    Omlet.exit(rdl);
}

//we attach these to the poll responses for when someone taps on them
function functionForResponse(response, poll) {
    return function() {

        //repackage the existing poll JSON again so that if someone in a chat taps it, they can get back to the poll
        var rdl = Omlet.createRDL({
                noun: "a poll response",
                displayTitle: "WatchPoll",
                displayText: "I voted for: " + JSON.parse(poll.responses)[response],
                json: poll,
                callback: encodeURI(window.location.href)
            });
        Omlet.exit(rdl);
    };
}

//add additional response fields to the UI
function addResponse() {
    var option = String.fromCharCode(65 + responseCount);
    $("#responses").append('<p>Option ' + option + '</p><input id="answer'+responseCount+'" class="form_format" type="text">');
    responseCount++;
}


//show the poll with questions/responses pulled from the chat object
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

//this is the entry point to your app, and is called by Omlet when it has finished loading it's stuff
Omlet.ready(function() {
    var poll = Omlet.getPasteboard();

    if(poll) {
        ShowQuestionForm(poll);
    }

    else {
        ShowEmptyQuestionForm();
    }
});

