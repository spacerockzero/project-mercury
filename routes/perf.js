var express = require('express');
var router = express.Router();
var juve = require('juve');
var sites = require('../config/sites');
var rules = require('../config/rules');

rules.standard = {

};

/* GET users listing. */
router.post('/', function(req, res, next) {
  console.log('req.repository.name',req.body.repository.name);
  console.log('rules.standard',rules.standard);
  var urls = sites[req.body.repository.name];
  console.log('urls',urls);
  urls.map(function(site){
    runPerfTest(site);
  });
  res.send('respond with a perf resource');

});

function runPerfTest(site){
  console.log('site',site);
  juve(site, rules.standard, function(results) {
    console.log('site=',site);
    console.log('results',results);
  });
}

module.exports = router;
