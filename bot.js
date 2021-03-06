var HTTPS = require('https');
var REQ = require('request');
var v = require('voca');
//var fs= require('fs');

var botID = process.env.BOT_ID;
var sendText = '';


function respond() {
  var request = JSON.parse(this.req.chunks[0]),
      botCardRegex = /^!card/i,
      botRuleRegex = /^!rule/i,
      botSHRegex = /^!sh/i,
      url = 'https://api.fiveringsdb.com/cards',
      searchText = '',
      cards = [],
      //cardID = [],
      //cardSet = [],
      cardURL = [],
      cardText = [],
      searchResult = [];

  if(request.text && (botCardRegex.test(request.text) || botRuleRegex.test(request.text))) {

    if (botCardRegex.test(request.text)) {  //Process card search
      searchText = (request.text.replace(/!card /i, ''));
      var cardRegex = new RegExp (searchText.toLowerCase());
      //Search for Card info via API
      REQ.get({  
        url: url,
        json: true
        }, function (error, response, cardbody) {
          if (!error && response.statusCode === 200) {
          //console.log(cardbody.size); // Print the json response
            //var numCards = (cardbody.size);
            //console.log ('Length = ' + cardbody.length);
            for (var i=0; i < cardbody.size; i++) {
              cards.push(cardbody.records[i].name_canonical);
              //console.log('Cards - ' + cards[i]);
              //cardID.push(cardbody.records[i].id.toLowerCase());
              //console.log('IDs - ' + cardID.length);
              //cardSet.push(cardbody.records[i].pack_cards[0].pack.id.toLowerCase());
              cardText.push(cardbody.records[i].text_canonical);
              if (cardbody.records[i].pack_cards[0] !== undefined)
              {
                cardURL.push(cardbody.records[i].pack_cards[0].image_url);
              } else
              {
                cardURL.push(cardbody.records[i].name + ' - No card URL for this card yet.\nCard text : ' + cardText[i]);
              }
              //console.log(cardSet);
              //console.log(cardbody.records[i].name);
              //console.log(cardbody.records[i]);
            }
          }
          
          for (var i=0; i < cards.length; i++) {
            if (cardRegex.test(cards[i])) {
            searchResult.push(cards[i]);
            //console.log(cards[i]+ ' matches '+searchText+' index '+i);
            } else {
            //console.log('Tested \"' + searchText.toLowerCase() + '\" against ' +  cards[i] + ' - No Match');
            }
          }
          
          if (searchResult.length == 1) {
            var match = cards.indexOf(searchResult[0]);
            //console.log('Match - ' + searchResult + ' ' + match)
            //sendText = 'https://fiveringsdb.com/static/cards/' + cardSet[match] + '/' + cardID[match] + '.jpg';
            sendText = cardURL[match];
            postMessage();
            //console.log (searchText);
          } else if (searchResult.length > 1) {
            match = cards.indexOf(searchResult[0]);
            //sendText = 'https://fiveringsdb.com/static/cards/' + cardSet[match] + '/' + cardID[match] + '.jpg';
            sendText = cardURL[match];
            postMessage();
            sendText = 'Additional Results : ';
            for (var i=1; i < searchResult.length; i++) {
              sendText += v.titleCase(searchResult[i]);
              if (i < searchResult.length-1) {
                sendText += ', ';
              }
            }
          } else {
            sendText = 'No Results Found - ' + v.titleCase(searchText);
            postMessage();
          } 
        });

//  Check for rulings against the card database

    } else if (botRuleRegex.test(request.text)) {  //Process Rules Question
      searchText = (request.text.replace(/!rule /i, ''));
      var ruleRegex = new RegExp (searchText.toLowerCase());
      var rules =[];
      //sendText = 'Rules Checking not implemented at this time';
      REQ.get({  
        url: url,
        json: true
        }, function (error, response, cardbody) {
          if (!error && response.statusCode === 200) {
            for (var i=0; i < cardbody.size; i++) {
              cards.push(cardbody.records[i].name_canonical);
          }
          
          for (var i=0; i < cards.length; i++) {
            if (ruleRegex.test(cards[i])) {
            searchResult.push(cards[i]);
            //console.log(cards[i]+ ' matches '+searchText+' index '+i);
            } else {
            //console.log('Tested \"' + searchText.toLowerCase() + '\" against ' +  cards[i] + ' - No Match');
            }
          }
          
          if (searchResult.length == 1) {
            var match = cards.indexOf(searchResult[0]);
            //console.log('Match - ' + searchResult + ' ' + match)
            //sendText = 'https://fiveringsdb.com/static/cards/' + cardSet[match] + '/' + cardID[match] + '.jpg';
            REQ.get({  
            url: 'https://fiveringsdb.com/cards/'+match[0]+'/rulings',
            json: true
            }, function (error, response, rulebody) {
              if (!error && response.statusCode === 200) {
                for (var j=0; j < rulebody.size; j++) {
                  sendText += (rulebody.records[i].text);
                }
              }
            });  
            postMessage();
            //console.log (searchText);
          } else if (searchResult.length > 1) {
            match = cards.indexOf(searchResult[0]);
            //sendText = 'https://fiveringsdb.com/static/cards/' + cardSet[match] + '/' + cardID[match] + '.jpg';
            sendText = cardURL[match];
            postMessage();
            sendText = 'Additional Results : ';
            for (var i=1; i < searchResult.length; i++) {
              sendText += v.titleCase(searchResult[i]);
              if (i < searchResult.length-1) {
                sendText += ', ';
              }
            }
          } else {
            sendText = 'No Results Found - ' + v.titleCase(searchText);
            postMessage();
          } 
        }
      });
    } else if (botSHRegex.test(request.text)) {
      searchText = (request.text.replace(/!sh /i, ''));
      var shRegex = new RegExp (searchText.toLowerCase());
      sendText = 'StrongHold list not implemented at this time';
      if (searchText == '') {
        
      }
      postMessage();
    }


  } else {
    console.log("don't care");
  }
  this.res.writeHead(200);
  this.res.end();
}

function postMessage() {
  var botResponse, options, cardbody, botReq;

  botResponse = sendText;

  options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };

  cardbody = {
    "bot_id" : botID,
    "text" : botResponse
  };

  console.log('sending ' + botResponse + ' to ' + botID);

  botReq = HTTPS.request(options, function(res) {
      if(res.statusCode == 202) {
        //neat
      } else {
        console.log('rejecting bad status code ' + res.statusCode);
      }
  });

  botReq.on('error', function(err) {
    console.log('error posting message '  + JSON.stringify(err));
  });
  botReq.on('timeout', function(err) {
    console.log('timeout posting message '  + JSON.stringify(err));
  });
  botReq.end(JSON.stringify(cardbody));
}

exports.respond = respond;