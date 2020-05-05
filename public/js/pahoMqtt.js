function startConnect() {
    // Generate a random client ID
    clientID = "clientID_" + parseInt(Math.random() * 100);

    host = 'hairdresser.cloudmqtt.com';
    port = 37550;

    // Print output for the user in the messages div
    document.getElementById("messages").innerHTML += '<span>Connecting to: ' + host + ' on port: ' + port + '</span><br/>';
    document.getElementById("messages").innerHTML += '<span>Using the following client value: ' + clientID + '</span><br/>';

    // Initialize new Paho client connection
    client = new Paho.MQTT.Client(host, Number(port), clientID);

    // Set callback handlers
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;

    client.connect({ 
        useSSL: true,
        //userName: "aknoqmjv",
        //password: "sBH7DL2-cPd-",
        userName: "yoga",
        password: "dwiseptana",
        onSuccess: onConnect,
        onFailure: doFail,
        //reconnect: true
    });
}

function doFail(e){
    console.log(e);
  }

// Called when the client connects
function onConnect() {
    // Fetch the MQTT topic from the form
    topic = "camera";

    // Print output for the user in the messages div
    document.getElementById("messages").innerHTML += '<span>Subscribing to: ' + topic + '</span><br/>';

    // Subscribe to the requested topic
    client.subscribe(topic);

    message = new Paho.MQTT.Message("Hello CloudMQTT");
    message.destinationName = topic;
    client.send(message);
}

// Called when the client loses its connection
function onConnectionLost(responseObject) {
    document.getElementById("messages").innerHTML += '<span>ERROR: Connection lost</span><br/>';
    if (responseObject.errorCode !== 0) {
        document.getElementById("messages").innerHTML += '<span>ERROR: ' + + responseObject.errorMessage.toString() + '</span><br/>';
    }
}

// Called when a message arrives
function onMessageArrived(message) {
    document.getElementById("messages").innerHTML += '<span>Topic: ' + message.destinationName + '  | ' + message.payloadString + '</span><br/>';
}