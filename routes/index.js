var express = require('express');
var router = express.Router();
var multer  = require('multer');
var fs = require('fs');
var upload = multer({ dest: '/tmp/'});
var path = require('path');
var mqtt = require('mqtt');
var dbFileName = path.join(__dirname, '../public/data_/database.json');
const dbFile = require(dbFileName);

// AWS Initial Config
const credJson = require(path.join(__dirname, '../credentials.json'));
var AWS = require('aws-sdk');
var creds = new AWS.Credentials(
  credJson.access_key_id,
  credJson.secret_access_key,
  credJson.session_token
);

AWS.config.update({
    region: "us-east-1",
    credentials: creds
});

// MQTT Config
var opt = {
  port: 17550,
  host: 'mqtt://hairdresser.cloudmqtt.com',
  clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
  username: 'yoga',
  password: 'dwiseptana',
  keepalive: 60,
  reconnectPeriod: 1000,
  protocolVersion: 4,
  clean: true,
  encoding: 'utf8'
};

var client = mqtt.connect('mqtt://hairdresser.cloudmqtt.com', opt);

client.on('connect', function () {
    client.subscribe('kondisi1');
	console.log('Subscribed kondisi1');
})

client.on('message', function (topic, message) {
	console.log(topic.toString());
	context = message.toString();
	console.log(context);
	
	if(context.indexOf("ano") !== -1){
		dbFile[0].kondisi[0].anorganik = "penuh";
		console.log("anorganik!!!");
	} else if (context.indexOf("org") !== -1){
		dbFile[0].kondisi[0].organik = "penuh";
		console.log("organik!!!");
	}
	
	// null - represents the replacer function. (in this case we don't want to alter the process)
			// 2 - represents the spaces to indent.
	fs.writeFile(dbFileName, JSON.stringify(dbFile, null, 2), function writeJSON(err) {
		if (err) return console.log(err);
			console.log(JSON.stringify(dbFile));			  
			console.log('writing to ' + dbFileName);
	});
})

router.get('/', function(req, res, next) {
  res.render('index', { title: 'HTTP RECEIVER' , message : 'This is message' , infor : client.connected});
});

// global variable untuk link gambar
var namaFile = null;

// POST + classification
router.post('/post', upload.single('file'), function(req, res, next) {
  namaFile = getWaktuSekarang();

  // penamaan file dengan mengambil waktu sekarang sampai dengan seconds
  var file = path.join(__dirname, '../public/capturedphotos/', namaFile + '.jpg');

  fs.rename(req.file.path, file, function(err) {
    if (err) {
      console.log(err);
      res.send(500);
    }
  });

  // membuat aksi lanjutan setelah mengeksekusi route /post
  next()
}, function(req, res){
	var fileToRead = path.join(__dirname, '../public/capturedphotos/', namaFile + '.jpg');
	
  var rekognition = new AWS.Rekognition();

  fs.readFile(fileToRead, function(err, data) {
    if (err) throw err; // Fail if the file can't be read.

    let image = data;

    var params = { // parameter untuk detectLabals
      Image: {
       Bytes: image
      }, 
      MaxLabels: 10, 
      MinConfidence: 50
    };
    
    rekognition.detectLabels(params, function(err, data) {
		if (err) { // an error occurred
			console.log(err, err.stack); 
		} else { // successful response
			var listLabel = [];
			var classification = null;
			
			// label list from AWS
			var listOrganik = ['Apparel', 'Paper', 'Origami', 'Plant', 'Leaf', 'Tree', 'Blossom', 'Paper Towel', 'Tissue', 'Diaper'];
			var listAnorganik = ['Label', 'Electronics', 'Plastic', 'Plastic Bag', 'Electrical device', 'Switch', 'Accessory', 'Crystal'];
			
			var probOrganik = 0;
			var probAnorganik = 0;
			var sumConfidenceOrg = 0;
			var sumConfidenceAno = 0;
			
			console.log(data);
			
			for(let i=0; i<(data.Labels).length; i++){
				listLabel[i] = data.Labels[i].Name;
				
				for(let j=0; j<listOrganik.length; j++){
					if(listLabel[i] == listOrganik[j]){
						probOrganik++;
						sumConfidenceOrg += data.Labels[i].Confidence;
					}
				}
			
				for(let k=0; k<listAnorganik.length; k++){
					if(listLabel[i] == listAnorganik[k]){
						probAnorganik++;
						sumConfidenceAno += data.Labels[i].Confidence;
					}
				}
			}
			
			let totProbOrganik = sumConfidenceOrg / probOrganik;
			let totProbAnorganik = sumConfidenceAno / probAnorganik;
			
			// avoid NaN value
			if(probOrganik == 0) totProbOrganik = 0;
			if(probAnorganik == 0) totProbAnorganik = 0;
			
			if(totProbOrganik > totProbAnorganik){
				console.log('ORGANIK');
				classification = 'organik';
			} else if (totProbOrganik == 0 && totProbAnorganik == 0) {
				console.log('UNDEFINED');
				classification = 'undefined';
			} else {
				console.log('ANORGANIK');
				classification = 'anorganik';
			}

		  client.publish('klasif1', classification, function() {
			dbFile[0].klasifikasi = classification;

			// null - represents the replacer function. (in this case we don't want to alter the process)
			// 2 - represents the spaces to indent.
			fs.writeFile(dbFileName, JSON.stringify(dbFile, null, 2), function writeJSON(err) {
			  if (err) return console.log(err);
			  console.log(JSON.stringify(dbFile));
			  console.log('writing to ' + dbFileName);
			});

			console.log(classification + ' Published!');
		  });

		  res.json({
			message: 'File uploaded successfully',
			filename: namaFile + '.jpg',
			Klasifikasi : classification
		  });
		}
    });
  });
});

router.get('/listphotos', function(req, res, next) {
  var directoryPath = path.join(__dirname, '../public/capturedphotos/');
  var jsonFile = JSON.parse('[]');

  fs.readdir(directoryPath, function (err, files) {
    //handling error
    if (err) {
      return console.log('Unable to scan directory: ' + err);
    } 
    //listing all files using forEach
    files.forEach(function (file) {
        // menambahkan semua gambar ke json
        jsonFile.push({gambar:file});
    });
    res.render('http_se', {gambar : jsonFile});
  });
});

router.get('/info', function(req, res){
  res.json({dbFile});
})

function getWaktuSekarang(){
  let dateObj = new Date(Date.now());

  // mendapatkan waktu sekarang
  // '0' agar ada tambahan angka 0 jika terjadi 1 digit, misal 5 => 05
  let date = ("0" + dateObj.getDate()).slice(-2);
  let month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
  let year = dateObj.getFullYear();
  let hours = ("0" + dateObj.getHours()).slice(-2);
  let minutes = ("0" + dateObj.getMinutes()).slice(-2);;
  let seconds = ("0" + dateObj.getSeconds()).slice(-2);

  let waktuSekarang = year + month + date + hours + minutes + seconds;

  return waktuSekarang;
}

module.exports = router;