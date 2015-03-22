var express = require('express');
var router = express.Router();
var async = require('async');
var phantomas = require('phantomas');
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
    thisConfig.cookie = 'fssessionid='+req.query.fssessionid+';domain=beta.familysearch.org';
  }
  console.log('thisConfig:',thisConfig);
  var urls = sites[req.params.app];
  console.log('urls',urls);
  // map the perf test functions in serial, so the server doesn't get overwhelmed
  async.mapSeries(urls,function(site,callback){
    runPerfTest(req.params.app,site,thisConfig,callback);
  },function(err, results){
    if(err) console.error('ERROR: async error ',err);
  });
  res.send('running perf tests on ' + req.params.app);
});


function runPerfTest(appName,site,config,cb){
  console.log('perftest site',site);
  console.log('perftest appName',appName);
  console.log('perftest config',config);
  config = config || rules.standard;
  config.url = site;
  console.log('config before run: ',config);

  var task = phantomas(config.url,config);

  task.then(function(res) {
    var thisResults = res.results;
    // console.log('res',res);
    console.log('Exit code: %d', res.code);
    console.log('res.json.url',res.json.url);
    var thisjson = {
      metrics: res.results.getMetrics(),
      offenders: res.results.getAllOffenders()
    };
    savePerfTest(appName,res.json.url,thisjson,function(err, record){
      console.log('err: ',err);
      console.log('record saved:',res.json.url);
      thisjson = null;
    });
    if(cb) cb(); //don't wait for db to start next test
  }).
  fail(function(code) {
    console.log('FAIL: Exit code #%d', code);
    if(cb) cb();
    process.exit(code);
  }).
  progress(function(progress) {
    console.log('Loading progress: %d%', progress * 100);
  }).
  done();
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
      title: 'All Apps',
      appNames: appNames
    });
  });
});

/* GET performance data dashboard for one app*/
router.get('/:appName', function(req, res, next) {
  res.render('appPerformance',{
    title: 'App Performance by unique URL',
    records: res.locals.records
  });
});


// Prefetch the app records for this app
router.param('appName', function(req, res, next, appName) {

  // get the last test record from each of the unique urls tested under current app (much faster)
  var urls = sites[appName];
  var appData = [];
  function getAppData(url,cb) {
    // get latest record matching this url:
    var query = Record.findOne({url: url}, {}, { sort: { 'created_at': -1 }});
    var promise = query.exec();
    promise.addBack(function(err, record){
      if(err) {
        console.log('err',err);
      }
      else if(record) {
        record = minimizeData(record);
        // pushes record[]
        appData.push(record);
      }
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


function minimizeData(record) {
  // pass on a much smaller record for the minimal results view
  record.data.metrics = {
    requests: record.data.metrics.requests || '',
    bodySize: record.data.metrics.bodySize || '',
    oldCachingHeaders: record.data.metrics.oldCachingHeaders || '',
    cachingDisabled: record.data.metrics.cachingDisabled || '',
    cachingTooShort: record.data.metrics.cachingTooShort || '',
    cachingNotSpecified: record.data.metrics.cachingNotSpecified || '',
    cachePasses: record.data.metrics.cachePasses || '',
    cacheMisses: record.data.metrics.cacheMisses || '',
    cacheHits: record.data.metrics.cacheHits || ''
  };
  record.data.offenders = {
    biggestLatency: record.data.offenders.biggestLatency || '',
    slowestResponse: record.data.offenders.slowestResponse || '',
    biggestResponse: record.data.offenders.biggestResponse || '',
    timeToFirstImage: record.data.offenders.timeToFirstImage || '',
    timeToFirstJs: record.data.offenders.timeToFirstJs || '',
    timeToFirstCss: record.data.offenders.timeToFirstCss || '',
    assetsWithCookies: record.data.offenders.assetsWithCookies || '',
    assetsNotGzipped: record.data.offenders.assetsNotGzipped || '',
    redirects: record.data.offenders.redirects || '',
    localStorageEntries: record.data.offenders.localStorageEntries || '',
    documentWriteCalls: record.data.offenders.documentWriteCalls || '',
    headersBiggerThanContent: record.data.offenders.headersBiggerThanContent || '',
    globalVariables: record.data.offenders.globalVariables || '',
    domains: record.data.offenders.domains || '',
    imagesWithoutDimensions: record.data.offenders.imagesWithoutDimensions || '',
    commentsSize: record.data.offenders.commentsSize || '',
    domainsWithCookies: record.data.offenders.domainsWithCookies || '',
    cachingDisabled: record.data.offenders.cachingDisabled || '',
    cachingTooShort: record.data.offenders.cachingTooShort || '',
    cachingNotSpecified: record.data.offenders.cachingNotSpecified || '',
    cacheMisses: record.data.offenders.cacheMisses || '',
    webfontCount: record.data.offenders.webfontCount || '',
    imageCount: record.data.offenders.imageCount || '',
    jsonCount: record.data.offenders.jsonCount || '',
    jsCount: record.data.offenders.jsCount || '',
    cssCount: record.data.offenders.cssCount || '',
    htmlCount: record.data.offenders.htmlCount || '',
    ajaxRequests: record.data.offenders.ajaxRequests || '',
    postRequests: record.data.offenders.postRequests || ''
  };
  return record;
}

module.exports = router;
