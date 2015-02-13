var express = require('express');
var router = express.Router();
var phantomas = require('phantomas');
var sites = require('../config/sites');
var rules = require('../config/rules');
var mongoose = require('mongoose'),
    Record = require('../models/Record');

rules.standard = {

};

/* GET users listing. */
router.post('/', function(req, res, next) {
  res.send('respond with a perf resource');
  console.log('req.repository.name',req.body.repository.name);
  console.log('rules.standard',rules.standard);
  var urls = sites[req.body.repository.name];
  console.log('urls',urls);
  urls.map(function(site){
    runPerfTest(req.body.repository.name,site);
  });
});

router.get('/', function(req, res, next) {
  // get records
  Record.find(function(err, records){
    // returns records[]
    if(err) next(err);
    res.render('perf',{
      title: 'Performance View',
      records: records
    });
  });
});

function runPerfTest(appName,site){
  console.log('site',site);
  var task = phantomas(site, rules.standard, function(error, json, results) {
  });
  task.on('results', function(results){
    console.log('site=',site);
    console.log('results',results);
    console.log('results.getMetrics()',results.getMetrics());
    console.log('results.getAllOffenders()',results.getAllOffenders());
    var json = {
      metrics: results.getMetrics(),
      offenders: results.getAllOffenders(),
      url: site
    };
    savePerfTest(appName,json,function(err, record){
      console.log('err: ',err);
      console.log('record: ',record);
    });
  });
}

function savePerfTest(appName,data,cb){
  if(appName && data){
    var newRecord = new Record({appName:appName, data:data});
    newRecord.save(function(err, record){
      cb(err, record);
    });
  }
}

module.exports = router;
