var express = require('express');
var router = express.Router();
var mqtt = require('mqtt');
const fs = require('fs');
//var io = require('socket.io')(3000);

var options = {
    port: 17550,
    host: 'mqtt://hairdresser.cloudmqtt.com',
    clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
    username: 'yoga',
    password: 'dwiseptana',
    keepalive: 60,
    reconnectPeriod: 1000,
    protocolId: 'MQIsdp',
    protocolVersion: 4,
    clean: true,
    encoding: 'utf8'
};
//var client  = mqtt.connect('mqtt://hairdresser.cloudmqtt.com');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' , message : 'This is message'});
  //next();

  var client = mqtt.connect('mqtt://hairdresser.cloudmqtt.com', options);

  client.on('connect', function() { // When connected
      console.log('connected');
      //document.getElementById("status").innerHTML += 'connected';
      // subscribe to a topic
      client.subscribe('camera');
      //res.render('index', { status: 'connected' });
      //socket.emit('news', { hello: 'world' });
      //return;
  });

  client.on('message', function(topic, message, packet) {
    console.log("Message Arrived");
    //console.log("Received '" + message + "' on '" + topic + "'");
    //console.log(typeof message);
    console.log("Received '" + message + "' on '" + topic + "'" + " Packet topic '" + packet.topic + "' on payload '" + packet.payload + "'");
    //res.render('index', { status: topic.toString() });
    var image = new Buffer(message, 'base64');
    //console.log("Image : " + image);

    if(packet.topic == "camera"){
        // image+=packet.payload;
        // console.log('Image+=packetPayload ' + image)
        console.log("Image : " + image);

        // if (packet.topic == "eof")
        // {
            fs.writeFile(client.id+".jpg", image, (err) => {
                if (err) throw err;
                console.log('It\'s saved!');
            });
        // }
    }
  });

});

router.post('/konek', function(req, res) {
  var txt = JSON.stringify(req.body);
  res.render('index', { isiform : txt});
  console.log(req.body);
});

// io.on('connection', function(socket){
//   console.log('IO user connected');
// });

module.exports = router;
