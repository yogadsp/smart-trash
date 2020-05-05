var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('http_se', { title: 'HTTP RECEIVER' , message : 'This is message'});

});

router.post('/post', function(req, res) {
    var body = req.body;
	var isi = req.body.sensor;
	console.log("Isi " + isi);
	console.log("Body " + body.toString());
});

module.exports = router;