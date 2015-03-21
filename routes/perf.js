var express = require('express');
var router = express.Router();
var phantomas = require('phantomas'),
    task;
var sites = require('../config/sites');
var rules = require('../config/rules');
var mongoose = require('mongoose'),
    Record = require('../models/Record');


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
  console.log('req.param.app',req.params.app);
  console.log('rules.standard',rules.standard);
  var thisConfig = rules.standard;
  if(req.query.fssessionid) {
    console.log('fssessionid passed in');
    thisConfig['cookie'] = 'fssessionid='+req.query.fssessionid+';domain=beta.familysearch.org';
  }
  console.log('thisConfig:',thisConfig);
  var urls = sites[req.params.app];
  console.log('urls',urls);
  urls.map(function(site){
    runPerfTest(req.params.app,site,thisConfig);
  });
  res.send('running perf tests on ' + req.params.app);
});


function runPerfTest(appName,site,config){
  console.log('perftest site',site);
  console.log('perftest appName',appName);
  console.log('perftest config',config);
  var thisConfig = config || rules.standard
  thisConfig.url = site;
  console.log('thisConfig before run: ',thisConfig);
  task = phantomas(thisConfig.url,thisConfig)
  // , function(error, json, results) {
  //   appName = site = config = thisConfig = false;
  //   if(error) return console.error('ERROR: ',error);
  //   // else if (json.url !== site){
  //   //   return console.log('ERROR: Not correct page, forwarded to: ',json.url);
  //   // }
  //   // else {
  //   //   console.log('returned results for ', site);
  //   //   // console.log('site=',site);
  //   //   // console.log('results',results);
  //   //   // console.log('json',json);
  //   //   // console.log('results.getMetrics()',results.getMetrics());
  //   //   // console.log('results.getAllOffenders()',results.getAllOffenders());
  //   //   var jsonResults = {
  //   //     metrics: results.getMetrics(),
  //   //     offenders: results.getAllOffenders(),
  //   //     url: site
  //   //   };
  //   //   savePerfTest(appName,site,jsonResults,function(err, record){
  //   //     console.log('err: ',err);
  //   //     console.log('record saved');
  //   //   });
  //   // }
  // });
  task.then(function(res) {
    var thisResults = res.results;
  	// console.log('res',res);
    console.log('Exit code: %d', res.code);
    console.log('res.json.url',res.json.url);
  	// console.log('Number of requests: %d', res.results.getMetric('requests'));
  	// console.log('Failed asserts: %j', res.results.getFailedAsserts());
    // var testedUrl = thisResults.getUrl();
    // console.log('returned results for ', testedUrl, ': thisResults',thisResults);
    // // console.log('thisResults.getMetrics()',thisResults.getMetrics());
    // // console.log('thisResults.getAllOffenders()',thisResults.getAllOffenders());
    // // if(testedUrl !== thisConfig.url){
    // //   return console.log('ERROR: Not correct page, forwarded to: ',testedUrl);
    // // }
    // // else {
    var thisjson = {
      metrics: thisResults.getMetrics(),
      offenders: thisResults.getAllOffenders(),
      url: res.json.url
    };
    savePerfTest(appName,res.json.url,thisjson,function(err, record){
      console.log('err: ',err);
      console.log('record saved');
    });
    // }
  }).
  fail(function(code) {
  	console.log('FAIL: Exit code #%d', code);
  	process.exit(code);
  }).
  progress(function(progress) {
  	console.log('Loading progress: %d%', progress * 100);
  }).
  done();
  // task.on('results', function(results){
  //   var thisResults = results;
  //   var testedUrl = thisResults.getUrl();
  //   console.log('returned results for ', testedUrl);
  //   console.log('thisResults',thisResults);
  //   // console.log('results.getMetrics()',results.getMetrics());
  //   // console.log('results.getAllOffenders()',results.getAllOffenders());
  //   if(testedUrl !== thisConfig.url){
  //     return console.log('ERROR: Not correct page, forwarded to: ',testedUrl);
  //   }
  //   else {
  //     var thisjson = {
  //       metrics: thisResults.getMetrics(),
  //       offenders: thisResults.getAllOffenders(),
  //       url: testedUrl
  //     };
  //     savePerfTest(appName,testedUrl,thisjson,function(err, record){
  //       console.log('err: ',err);
  //       console.log('record saved');
  //     });
  //   }
  // });
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
