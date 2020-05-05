var mqtt = require('mqtt');

var options = {
    port: 17550,
    host: 'mqtt://hairdresser.cloudmqtt.com',
    clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
    username: 'yoga',
    password: 'dwiseptana',
    keepalive: 60,
    reconnectPeriod: 1000,
    protocolId: 'MQIsdp',
    protocolVersion: 3,
    clean: true,
    encoding: 'utf8'
};
//var client  = mqtt.connect('mqtt://hairdresser.cloudmqtt.com');

var client = mqtt.connect('mqtt://hairdresser.cloudmqtt.com', options);
client.on('connect', function() { // When connected
    console.log('connected!!!!!!!!!!!!!');
    document.getElementById("status").innerHTML += 'connected';
    // subscribe to a topic
    client.subscribe('camera');
});

var image = new Buffer(0);;
client.on('message', function(topic, message, packet) {
    console.log("Received '" + message + "' on '" + topic + "'" + " Packet topic '" + packet.topic + "' on payload '" + packet.payload + "'");
    //console.log("Packet topic '" + packet.topic + "' on payload '" + packet.payload + "'");
    // if(packet.topic == "camera"){
    //     image+=packet.payload;
    //     console.log('Image+=packetPayload ' + image)

    //     if (packet.topic == "eof")
    //     {
    //         fs.writeFile(client.id+".jpg", image, (err) => {
    //             if (err) throw err;
    //             console.log('It\'s saved!');
    //         });
    //     }
    // }
});