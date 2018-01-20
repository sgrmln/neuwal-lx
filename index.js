'use strict'; 

/**
 *                                          █
 *                                          █
 *   █ ███    ████   █    █  █   █   ████   █      █████   ████   █ █ █
 *   ██   █  █    █  █    █  █   █       █  █     █       █    █  ██ █ █
 *   █    █  ██████  █    █  █ █ █   █████  █     █       █    █  █  █ █
 *   █    █  █       █    █  █ █ █  █    █  █     █       █    █  █  █ █
 *   █    █   ████    ████    █ █    █████  █  █   █████   ████   █  █ █
 * 
 * neuwal.com/alexa
 * alexa Service für Wahlumfragen und Transkripte
 * Informationen unter neuwal.com
 *
 */



var https = require('https');


// --------------- Helpers that build all of the responses -----------------------
function buildSpeechletResponse(title, cardOutput, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
/**        card: {
            type: 'Standard',
            title: title,
            text:  cardOutput,
            image: {
                smallImageUrl: 'https://neuwal.com/alexa/images/alexa-temp-lg.jpg',
                largeImageUrl: 'https://neuwal.com/alexa/images/alexa-temp-sm.jpg'
            }
        },   
*/ 
        card: {
            type: 'Simple',
            title: title,
            content:  cardOutput
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------
function getWelcomeResponse(callback) {
    const sessionAttributes = {};
    const cardTitle = 'Hallo bei neuwal.com!';
    const cardOutput = 'Fragen nach \'Wahlumfrage Österreich\',  \'Wahlumfrage Wien\' oder nach \'Transkript\'.';
    let speechOutput = '';
    let shouldEndSession = false;
    let repromptText = '';

    var httpCb = function(response) {
        var str= '';

        //another chunk of data has been revieved, so append it to 'str'
        response.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been recieved, so we just print it out here
        response.on('end', function () {
            console.log(str);

            const data = JSON.parse(str);
            const key = Object.keys(data.text)[0];
            const name = data.text[key][0].name;
            const reprompt = data.text[key][1].reprompt;


            console.log("Intro: ", name);

            speechOutput = `${name}`;
            repromptText = `${reprompt}`;
            shouldEndSession = false;
    
            // Setting repromptText to null signifies that we do not want to reprompt the user.
            // If the user does not respond or says something that is not understood, the session
            // will end.
            callback(sessionAttributes,
              buildSpeechletResponse(cardTitle, cardOutput, speechOutput, repromptText, shouldEndSession));
        });
    };

    https.request({
        host: 'neuwal.com',
        path: '/alexa/starte-alexa.php'
    }, httpCb).end();
}


function handleSessionEndRequest(callback) {
    const cardTitle = 'Bis bald!';
    const cardOutput = 'Besuche neuwal.com für mehr Politik in digitalen Formaten.';

    const speechOutput = 'Danke, dass Du neuwal.com besucht hast. Schönen Tag noch!';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, cardOutput, speechOutput, null, shouldEndSession));
}

// ------------------------------ TRANSCRIPT ------------------------------
function getTranscript(intent, session, callback) {
    const cardName = 'neuwal.com/transkript';

    var httpCb = function(response) {
        var str= '';

        const repromptText = 'Frag nach Wahlumfrage Österreich, Wahlumfrage Wien oder Transkript.';
        const sessionAttributes = {};
        let shouldEndSession = false;
        let speechOutput = '';

        //another chunk of data has been revieved, so append it to 'str'
        response.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been recieved, so we just print it out here
        response.on('end', function () {
            const data = JSON.parse(str);
            const key = Object.keys(data.transkript)[0];
            const name = data.transkript[key][0].name;
            const cardOutput = data.transkript[key][0].show;            

           if (speechOutput == null) {
                speechOutput= 'Kein Transkript gefunden. Bitte versuche es mit Wahlumfrage Österreich.'; 
            } else {
                speechOutput = `${name}`;
            }

            shouldEndSession = false;
    
            // Setting repromptText to null signifies that we do not want to reprompt the user.
            // If the user does not respond or says something that is not understood, the session
            // will end.
            callback(sessionAttributes,
                //buildSpeechletResponse(intent.name, cardOutput, speechOutput, repromptText, shouldEndSession));
                buildSpeechletResponse(cardName, cardOutput, speechOutput, repromptText, shouldEndSession));
        });
    };

    https.request({
        host: 'neuwal.com',
        path: encodeURI('/alexa/api-transkript.alexa.php')
        }, httpCb).end();
}
// ------------------------------ /TRANSCRIPT ------------------------------


// ------------------------------ WAHLUMFRAGE ------------------------------ 
function getWahlumfrage(intent, session, callback) {
    
    const temp= intent.value;
    const country= intent.slots.country.value;
    const countryName= intent.slots.country.value;
    let code = '1';
    let cardName= '';


    if (country === undefined) {
        code = '0';
        let country= null;
        cardName = 'neuwal.com/wahlumfragen';
    } else {
        cardName = 'neuwal.com/wahlumfragen';        

        if (country === 'österreich') {
            code = '1';
        } else if (country === 'wien') {
            code = '2';
        } else if (country === 'niederösterreich') {
            code = '3';
        } else if (country === 'oberösterreich') {
            code = '4';
        } else if (country === 'steiermark') {
            code = '5';
        } else if (country === 'burgenland') {
            code = '6';
        } else if (country === 'salzburg' || country === 'Salzburg') {
            code = '7';
        } else if (country === 'kärnten') {
            code = '8';
        } else if (country === 'vorarlberg') {
            code = '9';
        } else if (country === 'tirol' || country === 'tyrol' || country === 'Tirol' || country === 'Tyrol') {
            code = '10';
        } else if (country === 'ogm') {
            code = '9004';            
        } else if (country === 'unique research') {
            code = '9073';        
        } else if (country === 'research affairs') {
            code = '9155';        
        } else if (country === 'market') {
            code = '9001';        
        } else if (country === 'imas') {
            code = '9010';        
        } else if (country === 'ifes') {
            code = '9044';        
        } else if (country === 'triple m') {
            code = '9161';        
        } else if (country === 'hajek') {
            code = '9009';        
        } else if (country === 'peter hajek') {
            code = '9009';        
        } else if (country === 'gfk') {
            code = '9020'; 
        } else {
            code = '0';
            let country='none';
            cardName = 'neuwal.com';       
        }
    }
        

    var httpCb = function(response) {
        var str= '';

        const repromptText = 'Frag nach zum Beispiel Wahlumfrage Österreich oder Wahlumfrage Burgenland.';
        const sessionAttributes = {};
        let shouldEndSession = false;
        let speechOutput = '';


        //another chunk of data has been revieved, so append it to 'str'
        response.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been recieved, so we just print it out here
        response.on('end', function () {
            const data = JSON.parse(str);
            const key = Object.keys(data.wahlumfrage)[0];
            const name = data.wahlumfrage[key][0].name;
            const cardOutput = data.wahlumfrage[key][0].show;         
            speechOutput = `${name}`;

            if (speechOutput === "none")  {
                speechOutput= 'Da kann ich dir leider nicht weiterhelfen. Bitte probiere es nochmal mit Wahlumfrage Österreich, Wahlumfrage Bundesland oder Transkript.'; 
                cardName = 'neuwal.com';       
            } 
            
            shouldEndSession = false;
            //shouldEndSession = true;

    
            // Setting repromptText to null signifies that we do not want to reprompt the user.
            // If the user does not respond or says something that is not understood, the session
            // will end.
            callback(sessionAttributes,
                //buildSpeechletResponse(intent.name, cardOutput, speechOutput, repromptText, shouldEndSession));
                buildSpeechletResponse(cardName, cardOutput, speechOutput, repromptText, shouldEndSession));
        });
    };

    https.request({
        host: 'neuwal.com',
        //path: '/alexa/alexa.neuwal.wahlumfragen.json'
        //path: '/alexa/test.php?t=' + code + ''
        path: encodeURI('/alexa/api-wahlumfragen.alexa.php?c=' + code + '&cn=' + country)
        }, httpCb).end();
}
// ------------------------------ /WAHLUMFRAGE ------------------------------


// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'GetWahlumfrage') {
        getWahlumfrage(intent, session, callback);
    } else if (intentName === 'GetTranscript') {
//        getTranscript(intent, session, callback);
        getTranscript(intent, session, callback);
    } else if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error('Invalid intent');
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}




// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== 'amzn1.echo-sdk-ams.app.[unique-value-here]') {
             callback('Invalid Application ID');
        }
        */

        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};
