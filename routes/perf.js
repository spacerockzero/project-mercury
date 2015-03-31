var express = require('express');
var router = express.Router();
var async = require('async');
var phantomas = require('phantomas');
var sites = require('../config/sites');
var rules = require('../config/rules');
var mongoose = require('mongoose');
var Record = require('../models/Record');
var escape = require('escape-html');
var debug = require('debug')('perf');
var debugRecord = require('debug')('perf:records');



/*
   PUBLIC ROUTES
   ========================================================================== */

/* GET main performance data dashboard */
router.get('/', function(req, res, next) {
  debug('get index');
  // get distinct appNames
  Record.distinct('appName',{},function(err, appNames){
    debug('get distinct appNames:',appNames);
    // returns records[]
    if(err) {
      debug('get distinct appNames ERROR:',err);
      return next(err);
    }
    res.render('perf',{
      title: 'All Apps',
      appNames: appNames
    });
  });
});


/* GET performance data dashboard for one app*/
router.get('/:appName', function(req, res, next) {
  if(res.locals.records){
    res.render('appPerformance',{
      title: req.params.appName + ' scan results',
      records: res.locals.records
    });
  }
  else {
    console.error('ERROR: perf.js: get:appName');
    return next();
  }
});


// Prefetch the app records for this app
router.param('appName', function(req, res, next, appName) {
  debug('appName param, appName:',appName);
  // get the last test record from each of the unique urls tested under current app (much faster)
  var urls = sites[appName];
  var appData = [];

  function getAppData(url,cb) {
    debug('appName param, url:',url);
    // get latest record matching this url:
    var query = Record.find({url: url},{}).limit(1);
    var promise = query.exec();
    promise.addBack(function(err, records){
      if(err) {
        debug('appName param, db query returns. if (err):',err);
        console.log('ERROR: appName param, db query returns:',err);
        return cb(err);
      }
      else if(records[0]) {
        debug('appName param, db query returns. if (records[0]):');
        debug('appName param, db query returns. if (records[0]).url:',records[0].url);
        debugRecord('appName param, db query returns. if (records[0]):',records[0]);
        records = minimizeData(records[0]);
        // pushes records[]
        appData.push(records);
      }
      else {
        debug('appName param, db returns no object. else');
      }
      return cb(err);
    });
  }
  // get urls
  getDistinctUrls(appName,function(err,distinctUrls){
    if(err) return console.error('ERROR: getDistinctUrls, err:',err);
    // map them
    distinctUrls.map(function(url,arrElem){
      getAppData(url,function(err){
        debug('param appName, urls.map callback, arrElem, urls.length:',arrElem,distinctUrls.length);
        if(err) {
          console.error('ERROR: perf.js: getAppData()');
          return next(err);
        }
        if(arrElem === distinctUrls.length-1) {
          debug('url param callback, arrElem, urls.length-1',arrElem,distinctUrls.length-1)
          res.locals.records = appData.sort();
          return next();
        }
      });
    });
  });
});

function getDistinctUrls(appName,cb) {
  debug('getDistinctUrls: appName',appName);
  // get distinct appNames
  Record.distinct('url',{'appName':appName},function(err, distinctUrls){
    debug('getDistinctUrls: for:',appName);
    // returns records[]
    if(err) {
      console.error('getDistinctUrls: ERROR:',err);
      cb(err);
    }
    debug('getDistinctUrls, distinctUrls',distinctUrls);
    cb(err,distinctUrls);
  }).lean(true);
}



/*
   TRIGGER PERF TESTS
   ========================================================================== */

/* POST webhook to start the perf test */
router.post('/', function(req, res, next) {
  // configured to match hook from github, whose repo name matches site
  // array index for live site
  // doesn't have an automated way to get a sessionId,
  // so right now this only works for non-auth pages
  res.send('respond with a perf resource');
  console.log('req.repository.name',req.body.repository.name);
  console.log('rules.standard',rules.standard);
  var urls = sites[req.body.repository.name];
  console.log('urls',urls);
  // It's already fixed on the GET /run/ route
  async.mapSeries(urls,function(site,callback){
    runPerfTest(req.body.repository.name,site,thisConfig,callback);
  },function(err, results){
    if(err) console.error('ERROR: async error ',err);
  });
  res.send('running perf tests on ' + req.body.repository.name);
});


/* GET req to run scan on appname passed in, with optional query params */
router.get('/run/:app', function(req, res, next) {
  debug('/run/:app, req.param.app',req.params.app);
  debug('/run/:app, rules.standard',rules.standard);
  var thisConfig = rules.standard;
  if(req.query.fssessionid) {
    debug('/run/:app, fssessionid passed in');
    thisConfig.cookie = 'fssessionid='+req.query.fssessionid+';domain=beta.familysearch.org';
  }
  debug('/run/:app, thisConfig:',thisConfig);
  var urls = sites[req.params.app];
  debug('/run/:app, urls',urls);
  // map the perf test functions in serial, so the server doesn't get overwhelmed
  async.mapSeries(urls,function(site,callback){
    runPerfTest(req.params.app,site,thisConfig,callback);
  },function(err, results){
    if(err) console.error('ERROR: async error ',err);
    debug('/run/:app, done running tests, err:',err);
  });
  res.send('running perf tests on ' + req.params.app);
});



/*
   FUNCTIONS
   ========================================================================== */

// run test and save it to the db
function runPerfTest(appName,site,config,cb){
  console.log('runPerfTest(): perftest site',site);
  debug('runPerfTest(): perftest appName',appName);
  debug('runPerfTest(): perftest config',config);
  config = config || rules.standard;
  config.url = site;
  debug('runPerfTest(): config before run: ',config);

  var task = phantomas(config.url,config);

  task.then(function(res) {
    var thisResults = res.results;
    // debug('res',res);
    debug('Exit code: %d', res.code);
    debug('res.json.url',res.json.url);
    var thisjson = {
      metrics: res.results.getMetrics(),
      offenders: res.results.getAllOffenders()
    };
    // var thisUrl = escape(res.json.url);
    var thisUrl = res.json.url;
    savePerfTest(appName,thisUrl,thisjson,function(err, record){
      if(err){
        console.log('ERROR: saving test to db err: ',err);
        if(cb) cb();
      }
      else {
        console.log('record saved to db:',thisUrl);
        thisjson = null;
        if(cb) cb(); //don't wait for db to start next test
      }
    });
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


// pass on a much smaller record for the minimal results view
function minimizeData(record) {
  record.data.metrics = {
    requests: record.data.metrics.requests || '',
    cssCount: record.data.metrics.cssCount || '',
    jsCount: record.data.metrics.jsCount || '',
    imageCount: record.data.metrics.imageCount || '',
    bodySize: record.data.metrics.bodySize || '',
    cssSize: record.data.metrics.cssSize || '',
    jsSize: record.data.metrics.jsSize || '',
    imageSize: record.data.metrics.imageSize || '',
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
