var express = require('express');
var router = express.Router();
var multer  = require('multer');
var fs = require('fs');
var upload = multer({ dest: '/tmp/'});
var path = require('path');
var mqtt = require('mqtt');

// load file database
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

// menyesuaikan credential dan region
// untuk keperluan akses layanan cloud
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

// fungsi dipanggil saat mqtt konek
client.on('connect', function () {
    client.subscribe('kondisi1');
	console.log('Subscribed kondisi1');
})

// fungsi dipanggil saat mqtt menerima pesan
client.on('message', function (topic, message) {
	// menampilkan nama topik
	console.log(topic.toString());
	
	if(dbFile[0].id != ""){
		// mengubah isi pesan menjadi string
		isiPesan = message.toString();
		console.log(isiPesan);
		
		dbFile[0].kondisi = isiPesan;
	
		// null - represents the replacer function. (in this case we don't want to alter the process)
		// 2 - represents the spaces to indent.
		fs.writeFile(dbFileName, JSON.stringify(dbFile, null, 2), function writeJSON(err) {
			if (err) return console.log(err);
				console.log(JSON.stringify(dbFile));			  
				console.log('writing to ' + dbFileName);
		});
		
		// memanggil fungsi kirim notifikasi ke smartphone jika kotak sampah penuh
		if(isiPesan == "Penuh"){
			kirimNotif();
		}
	}
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
	// inisiasi gambar yang baru saja diupload
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
			
			// daftar nama label untuk sampah organik dan sampah anorganik
			// nama label default dari AWS
			var listOrganik = ['Paper', 'Origami', 'Plant', 'Leaf', 'Tree', 'Blossom', 'Paper Towel',
							   'Tissue', 'Diaper', 'Fruit', 'Cotton', 'Slate', 'Nature', 'Foil',
							   'Vegetable', 'Food', 'Insect', 'Invertebrate', 'Land', 'Animal'];
			var listAnorganik = ['Label', 'Electronics', 'Plastic', 'Plastic Bag', 'Electrical device', 'Switch', 
								 'Accessory', 'Crystal', 'Bottle', 'Drink', 'Mineral Water', 'Beverage',
								 'Rock', 'Weapon', 'Text'];
			
			// inisiasi untuk menampung level confidence dari setiap label
			var probOrganik = 0;
			var probAnorganik = 0;
			
			// inisiasi untuk menampung jumlah total confidence dari semua label
			var sumConfidenceOrg = 0;
			var sumConfidenceAno = 0;
			
			console.log(data);
			
			for(let i=0; i<(data.Labels).length; i++){
				// mendapatkan nama label dari respon AWS
				listLabel[i] = data.Labels[i].Name;
				
				for(let j=0; j<listOrganik.length; j++){
					// mengecek apakah nama label dari AWS ada yang cocok dengan array listOrganik
					if(listLabel[i] == listOrganik[j]){
						// probabilitas bertambah 1 jika ada yang cocok
						probOrganik++;
						
						// menghitung total level confidence
						sumConfidenceOrg += data.Labels[i].Confidence;
					}
				}
			
				for(let k=0; k<listAnorganik.length; k++){
					// mengecek apakah nama label dari AWS ada yang cocok dengan array listAnorganik
					if(listLabel[i] == listAnorganik[k]){
						// probabilitas bertambah 1 jika ada yang cocok
						probAnorganik++;
						
						// menghitung total level confidence
						sumConfidenceAno += data.Labels[i].Confidence;
					}
				}
			}
			
			// menghitung total probablilitas
			// jumlah level confidence dibagi jumlah label
			let totProbOrganik = sumConfidenceOrg;
			let totProbAnorganik = sumConfidenceAno;
			
			// avoid NaN value
			if(probOrganik == 0) totProbOrganik = 0;
			if(probAnorganik == 0) totProbAnorganik = 0;
			
			if(totProbOrganik > totProbAnorganik){
				console.log('ORGANIK');
				classification = 'organik';
			} else if (totProbOrganik == 0 && totProbAnorganik == 0) {
				console.log('ANORGANIK');
				classification = 'anorganik';
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

router.post('/tambahInfo', function(req, res, next){
	let lokasi = req.body.lokasi;
  
	dbFile[0].lokasi = lokasi;
	dbFile[0].id = "1";
	dbFile[0].kondisi = "Normal";

	// null - represents the replacer function. (in this case we don't want to alter the process)
	// 2 - represents the spaces to indent.
	fs.writeFile(dbFileName, JSON.stringify(dbFile, null, 2), function writeJSON(err) {
		if (err) return console.log(err);
		console.log(JSON.stringify(dbFile));
		console.log('writing to ' + dbFileName);
	});
});

router.post('/editInfo', function(req, res, next){
	let lokasi = req.body.lokasi;
  
	dbFile[0].lokasi = lokasi;

	// null - represents the replacer function. (in this case we don't want to alter the process)
	// 2 - represents the spaces to indent.
	fs.writeFile(dbFileName, JSON.stringify(dbFile, null, 2), function writeJSON(err) {
		if (err) return console.log(err);
		console.log(JSON.stringify(dbFile));
		console.log('writing to ' + dbFileName);
	});
});

router.get('/hapusInfo', function(req, res, next){
	dbFile[0].lokasi = "";
	dbFile[0].kondisi = "";
	dbFile[0].id = "";

	// null - represents the replacer function. (in this case we don't want to alter the process)
	// 2 - represents the spaces to indent.
	fs.writeFile(dbFileName, JSON.stringify(dbFile, null, 2), function writeJSON(err) {
		if (err) return console.log(err);
		console.log(JSON.stringify(dbFile));
		console.log('writing to ' + dbFileName);
	});
  
});

router.get('/listKotakSampah', function(req, res, next){
  res.json({dbFile});
});

function getWaktuSekarang(){
  // mendapatkan waktu sekarang
  let dateObj = new Date(Date.now());
  
  // '0' agar ada tambahan angka 0 jika terjadi 1 digit, misal 5 => 05
  let date = ("0" + dateObj.getDate()).slice(-2);
  let month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
  let year = dateObj.getFullYear();
  let hours = ("0" + dateObj.getHours()).slice(-2);
  let minutes = ("0" + dateObj.getMinutes()).slice(-2);;
  let seconds = ("0" + dateObj.getSeconds()).slice(-2);
  
  // digunakan untuk penamaan file gambar agar tidak terjadi duplikasi
  let waktuSekarang = year + month + date + hours + minutes + seconds;

  return waktuSekarang;
};

// inisiasi var admin untuk mengirim notif
var admin = require("firebase-admin");
	
// load konfigurasi dari menu layanan akun pada firebase
var serviceAccount = require(path.join(__dirname, '../smart-trash-firebase.json'));
	
// inisiasi credential service account firebase
// untuk keperluan push notification
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://smart-trash-db108.firebaseio.com"
});

// fungsi untuk mengirimkan notifikasi penuh ke smartphone
function kirimNotif(){
	// token yang didapat dari smartphone
	
	// hp samsung
	var token = 'c7XIofMtQq6JTlWYeHJ6qD:APA91bHIhmBMBixvgKtDg69FmrjHyGWcA6ELERR45F6HRNQs7l1HfDRbhzlvBBt3Ygo5ugnAEhN5vw2XAPpJzALf8AdNI9fepUG0YOc2MuZFIX4diAkTFdqTq05WAceqi5aaw45JWOLx';

	var message = {
	  notification : {
		title: "Notifikasi",
        body: "Kotak Sampah Penuh"
	  },
	  token: token
	};

	// Send a message to the device corresponding to the provided
	// registration token.
	admin.messaging().send(message)
	  .then((response) => {
		// Response is a message ID string.
		console.log('Successfully sent message:', response);
	  })
	  .catch((error) => {
		console.log('Error sending message:', error);
	  });
}

module.exports = router;