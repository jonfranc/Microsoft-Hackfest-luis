var builder = require('botbuilder');
var restify = require('restify');
var Bing = require('node-bing-api')({ accKey: process.env.BING_SEARCH });

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID, 
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

const LuisModelUrl = process.env.LUIS_URL;

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] })
    .matches('sendCall', [
        function (session, args, next) {
            
            var contact = builder.EntityRecognizer.findEntity(args.entities, 'emergency contact');
            var name = builder.EntityRecognizer.findEntity(args.entities, 'name');
            var encyclopedia = builder.EntityRecognizer.findEntity(args.entities, 'encyclopedia');
          
            var msg = "";
            
            if (contact) {
                msg += "I think your contact is: "+contact.entity+"\n";
            }
            if (name) {
                msg += "I think your name is: "+name.entity+"\n";
            }
            if (encyclopedia) {
                msg += "I think your encyclopedia is: "+encyclopedia.entity+"\n";
            }

                
            session.send('sendCall triggered: \'%s\'\n\n%s', session.message.text,msg);
        }
    ])
    .matches('diagnose', [
        function (session, args, next) {

            // try extracting entities
            var intensity = builder.EntityRecognizer.findEntity(args.entities, 'intensity');
            var contact = builder.EntityRecognizer.findEntity(args.entities, 'emergency contact');
            var location = builder.EntityRecognizer.findEntity(args.entities, 'location');

            var msg = "";
            
            if (intensity) {
                msg += "I think your intensity is: "+intensity.entity+"\n";
            }
            if (contact) {
                msg += "I think your contact is: "+contact.entity+"\n";
            }
            if (location) {
                msg += "I think your location is: "+location.entity+"\n";
            }


            session.send('diagnos triggered: \'%s\'\n\n%s', session.message.text,msg);
        }
    ])
    .onDefault((session) => {
        session.send('Sorry, I did not understand \'%s\'.', session.message.text);
        Bing.composite(session.message.text, {
        top: 5
        }, function(error, res, body){
            session.send('Here are some search results: %s', body.news);
        });
    });

bot.dialog('/', intents);