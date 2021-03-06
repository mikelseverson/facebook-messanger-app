var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var request = require('request');
var gcm = require('node-gcm');
var app = express();

require('@risingstack/trace');

var pushSender = new gcm.Sender('AIzaSyBbq7xy6Y8TFivbPPAgDShaAVWi4_KuT6M');
var token = "CAAKN2CoQPMoBAFPfZC9R09PetZCgB6TS5f76iWR72xicgsgMOZAJ4HbsZAo1pZBHxCpwdctPZAscnjIlnZCStQyvkB1uS8AykNLZBj2LS0ZB1JQgQNMYSik1YenHwjaLh7DZBG6XU0QuZCnHfzZALxIlg2fEGwvrlgBOleibtFoqakZBTztXZBGoWOXJ2JQzfjy3g08bEZD";
var regTokens = ['dfBg62BDGng:APA91bF_TzMWj6AZv518GNL5_BtiKD_3fWMIqg33vSsk33-V_uStHDQohoYtxydtj7mPCMr-pCwBarFqLtYStNzAMHirpphXFRjnoOIuwmM6gGVai8gDZ7Ff2mwS4Oq82j7s0rfk16QM'];

var endpointData = {
  title: 'New FB Message',
  message: 'no message data',
  image: {
    url: '/fbpush.jpg'
  },
  link: 'https://mikelseverson.com'
}

function sendTextMessage(sender, text) {
  messageData = {
    text:text
  }
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
    method: 'POST',
    json: {
      recipient: {id:sender},
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  });
}

function sendPushMessage() {
  var message = new gcm.Message();

  pushSender.send(message, regTokens, (err, response) => {
    if(err) console.error(err);
    else console.log(response);
  });
}

function updateEndpoint(data) {
  if(data.title) endpointData.title = data.title;
  if(data.message) endpointData.message = data.message;
  if(data.link) endpointData.link = data.link;
}

app.use(bodyParser.json())

app.get('/endpoint', (req, res) => {
  res.json(endpointData);
})
app.get('/webhook', function (req, res) {
  if (req.query['hub.verify_token'] === 'super-gipfy-secret') {
    res.send(req.query['hub.challenge']);
  }
  res.send('Error, wrong validation token');
})

app.post('/webhook/', function (req, res) {
  messaging_events = req.body.entry[0].messaging;
  for (i = 0; i < messaging_events.length; i++) {
    event = req.body.entry[0].messaging[i];
    sender = event.sender.id;
    if (event.message && event.message.text) {
      text = event.message.text;
      console.log(sender, text);

      updateEndpoint({message: sender + ": " + text})
      sendPushMessage();
      sendTextMessage(sender, "echo: " + text);
    }
  }
  res.sendStatus(200);
});

app.get("/*", (req, res, next) => {
    var file = req.params[0] || "index.html";
    res.sendFile(path.join(__dirname, "/public", file));
});

app.listen(process.env.PORT || 3000);
