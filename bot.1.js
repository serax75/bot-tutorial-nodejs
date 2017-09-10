var HTTPS = require('https');
var REQ = require('request');
var fs= require('fs');

var botID = process.env.BOT_ID;
var sendText = '';

function getCards() {
  if (fs.accessSync('cards.json')) {
    var cardsLocal = JSON.parse(fs.readFileSync('cards.json'));
    var cardsRemote = REQ.get('https://api.fiveringsdb.com/cards');
  } else {
    REQ.get('https://api.fiveringsdb.com/cards').pipe(fs.createWriteStream('cards.json'));
    cardsLocal = cardsRemote = JSON.parse('cards.json');
  }
  if (cardsLocal.last_updated == cardsRemote.last_updated) {
    return (cardsLocal);
  } else {
    fs.writeFile('cards.json', cardsRemote);
    return (cardsRemote);
  }
} 
  
function respond() {
  var request = JSON.parse(this.req.chunks[0]),
      botCardRegex = /^!card/i,
      botRuleRegex = /^!rule/i,
      botSHRegex = /^!sh/i,
      searchText = '';

  if(request.text && (botCardRegex.test(request.text) || botRuleRegex.test(request.text))) {

    if (botCardRegex.test(request.text)) {  //Process card search
      searchText = (request.text.replace(/!card /i, ''));
      var cardRegex = new RegExp (searchText.toLowerCase());
      //Search for Card info via API
      getCards();
      
    } else if (botRuleRegex.test(request.text)) {  //Process Rules Question
      searchText = (request.text.replace(/!rule /i, ''));
      sendText = 'Rules Checking not implemented at this time';
      postMessage();
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
  var botResponse, options, body, botReq;

  botResponse = sendText;

  options = {
    hostname: 'api.groupme.com',
    path: '/v3/bots/post',
    method: 'POST'
  };

  body = {
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
  botReq.end(JSON.stringify(body));
}

exports.respond = respond;