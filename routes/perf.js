var express = require('express');
var router = express.Router();
var phantomas = require('phantomas');
var sites = require('../config/sites');
var rules = require('../config/rules');
var mongoose = require('mongoose'),
    Record = require('../models/Record');

rules.standard = {

};

/* POST webhook to start the perf test */
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
/* GET req to run scan on appname passed in, with optional query params */
router.get('/run/:app', function(req, res, next) {
  res.send('running perf tests on ' + req.params.app);
  console.log('req.param.app',req.params.app);
  console.log('rules.standard',rules.standard);
  var urls = sites[req.params.app];
  console.log('urls',urls);
  urls.map(function(site){
    runPerfTest(req.params.app,site);
  });
});


function runPerfTest(appName,site){
  console.log('site',site);
  var task = phantomas(site, rules.standard, function(error, json, results) {
    if(error) console.error(error);
  });
  task.on('results', function(results){
    console.log('returned results for ', site);
    // console.log('site=',site);
    // console.log('results',results);
    // console.log('results.getMetrics()',results.getMetrics());
    // console.log('results.getAllOffenders()',results.getAllOffenders());
    var json = {
      metrics: results.getMetrics(),
      offenders: results.getAllOffenders(),
      url: site
    };
    savePerfTest(appName,site,json,function(err, record){
      console.log('err: ',err);
      console.log('record saved');
    });
  });
}

function savePerfTest(appName,url,data,cb){
  if(appName && url && data){
    var newRecord = new Record({appName:appName, url:url, data:data});
    newRecord.save(function(err, record){
      cb(err, record);
    });
  }
}


/* GET main performance data dashboard */
router.get('/', function(req, res, next) {
  // get distinct appNames
  Record.distinct('appName',{},function(err, appNames){
    // returns records[]
    if(err) next(err);
    res.render('perf',{
      title: 'Performance View',
      appNames: appNames
    });
  });
});

/* GET performance data dashboard for one app*/
router.get('/:appName', function(req, res, next) {
  res.render('dashApp',{
    title: 'App Performance View',
    records: res.locals.records
  });
});

// Prefetch the app records for this app
router.param('appName', function(req, res, next, appName) {
  // find all records that match the current app (very expensive and slow, too much data)
  // Record.find({appName: appName},function(err, records){
  //   console.log('err',err)
  //   console.log('records.length',records.length)
  //   // returns records[]
  //   if(err) next(err);
  //   res.locals.records = records;
  //   next();
  // });

  // get the last test record from each of the unique urls tested under current app (much faster)
  var urls = sites[appName];
  var appData = [];
  function getAppData(url,cb) {
    // get latest record matching this url:
    var query = Record.findOne({url: url}, {}, { sort: { 'created_at': -1 }})
    var promise = query.exec();
    promise.addBack(function(err, record){
      if(err) console.log('err',err);
      // pushes record[]
      appData.push(record)
      cb(err);
    });
  }
  urls.map(function(url){
    getAppData(url,function(err){
      if(err) next(err);
      if(appData.length === urls.length) {
        res.locals.records = appData.sort();
        return next();
      }
    });
  });

});

module.exports = router;
