var express = require('express');
var router = express.Router();
var multer  = require('multer');
var fs  = require('fs');
var upload = multer({ dest: '/tmp/'});
path = require('path');

router.get('/', function(req, res, next) {
  res.render('index', { title: 'HTTP RECEIVER' , message : 'This is message'});
});

router.post('/post', upload.single('file'), function(req, res) {
  var namaFile = 'gambar';

  // penamaan file dengan mengurutkan dari file terakhir
  fileTerakhir(function(namaFileTerakhir){
    var noUrut = namaFileTerakhir.substring(6, 7);

    if(noUrut == null){
      noUrut = 1;
    } else {
      noUrut++;
    }

    var file = path.join(__dirname, '../public/capturedphotos/', namaFile + noUrut + '.jpg');

    fs.rename(req.file.path, file, function(err) {
      if (err) {
        console.log(err);
        res.send(500);
      } else {
        res.json({
          message: 'File uploaded successfully',
          filename: namaFile + noUrut + '.jpg'
        });
      }
    });
  });
  
});

function fileTerakhir(callback){
  var directoryPath = path.join(__dirname, '../public/capturedphotos/');
  var namaFileTerakhir = null;
  
  fs.readdir(directoryPath, function (err, files) {
    //handling error
    if (err) {
      return console.log('Unable to scan directory: ' + err);
    } else {
      namaFileTerakhir = files[files.length - 1];
      callback(namaFileTerakhir);
    }
  });
}

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

module.exports = router;