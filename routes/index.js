var express = require('express');
var router = express.Router();
var multer  = require('multer');
var fs = require('fs');
var upload = multer({ dest: '/tmp/'});
var needle = require('needle');
var path = require('path');
var mqtt = require('mqtt');
var dbFileName = path.join(__dirname, '../public/data_/database.json');
const dbFile = require(dbFileName);

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

router.get('/', function(req, res, next) {
  res.render('index', { title: 'HTTP RECEIVER' , message : 'This is message' , infor : client.connected});
});

// global variable untuk link gambar
var namaFile = null;

// POST + classification
// router.post('/post', upload.single('file'), function(req, res, next) {
//   namaFile = getWaktuSekarang();

//   // penamaan file dengan mengambil waktu sekarang sampai dengan seconds
//   var file = path.join(__dirname, '../public/capturedphotos/', namaFile + '.jpg');

//   fs.rename(req.file.path, file, function(err) {
//     if (err) {
//       console.log(err);
//       res.send(500);
//     }
//   });

//   // membuat aksi lanjutan setelah mengeksekusi route /post
//   next()
// }, function(req, res){
//   var options = {
//     headers:  { 
//                 'Prediction-Key': '2f1de063387a4c51b872d84e5fa04cee', 
//                 'Content-Type'  : 'application/json'
//               }
//   }
//   // "http://52.163.219.128/capturedphotos/" + namaFile + ".jpg"
//   needle
//     .post(  'https://custom-vision-st.cognitiveservices.azure.com/customvision/v3.0/Prediction/861bb24c-ed41-48f7-928f-1febb1da8229/classify/iterations/Iteration1/url',
//             { "Url" : "https://mello.id/wp-content/uploads/2019/10/Sampah-Anorganik.jpg"}, options, function(err, resp) {
//       if(err){
//         console.log("ERROR : " + err);
//       } else {
//         // menangkap respon berbentuk json
//         let tempKlas = JSON.stringify(resp.body.predictions[0]);

//         // mendapatkan value nya saja
//         let klas = JSON.parse(tempKlas);
//         console.log("RESPON : " + klas['tagName']);

//         client.publish('klasif1', klas['tagName'], function() {
//           // res.writeHead(204, { 'Connection': 'keep-alive' });
//           // res.end();
//           dbFile[0].klasifikasi = klas['tagName'];

//           // null - represents the replacer function. (in this case we don't want to alter the process)
//           // 2 - represents the spaces to indent.
//           fs.writeFile(dbFileName, JSON.stringify(dbFile, null, 2), function writeJSON(err) {
//             if (err) return console.log(err);
//             console.log(JSON.stringify(dbFile));
//             console.log('writing to ' + dbFileName);
//           });

//           console.log(klas['tagName'] + ' Published!');
//         });

//         res.json({
//           message: 'File uploaded successfully',
//           filename: namaFile + '.jpg',
//           tagName : klas['tagName']
//         });
//       }
//     });
// });


// ====== POST SAJA ========
router.post('/post', upload.single('file'), function(req, res, next) {
  namaFile = getWaktuSekarang();

  // penamaan file dengan mengambil waktu sekarang sampai dengan seconds
  var file = path.join(__dirname, '../public/capturedphotos/', namaFile + '.jpg');

  fs.rename(req.file.path, file, function(err) {
    if (err) {
      console.log(err);
      res.send(500);
    } else {
      res.json({
        message: 'File uploaded successfully',
        filename: namaFile + '.jpg'
      });
    }
  });
});

router.get('/listphotos', function(req, res, next) {
  var directoryPath = path.join(__dirname, '../public/capturedphotos/');
  var jSonF = JSON.parse('[]');

  fs.readdir(directoryPath, function (err, files) {
    //handling error
    if (err) {
      return console.log('Unable to scan directory: ' + err);
    } 
    //listing all files using forEach
    files.forEach(function (file) {
        // menambahkan semua gambar ke json
        jSonF.push({gambar:file});
    });
    res.render('http_se', {ga : jSonF});
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