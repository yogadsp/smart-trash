var express = require('express');
var router = express.Router();
var multer  = require('multer');
var fs  = require('fs');
var upload = multer({ dest: '/tmp/'});
path = require('path');

router.get('/', function(req, res, next) {
  res.render('http_se', { title: 'HTTP RECEIVER' , message : 'This is message'});
});

router.post('/post', upload.single('file'), function(req, res) {
  var file = path.join(__dirname, '../public/capturedphotos/', req.file.originalname);
  fs.rename(req.file.path, file, function(err) {
    if (err) {
      console.log(err);
      res.send(500);
    } else {
      res.json({
        message: 'File uploaded successfully',
        filename: req.file.filename
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
    var i = 0;
    files.forEach(function (file) {
        // Do whatever you want to do with the file
        var str = "Gambar ke-" + i++;
        jSonF.push({gambar:file});
        console.log(file); 
        console.log(JSON.stringify(jSonF));
    });
    res.render('http_se', {ga : jSonF});
  });
});

module.exports = router;