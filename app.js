var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var compression = require('compression');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var routes = require('./routes/index');
var perf = require('./routes/perf');

var app = express();

/*
   Mongoose configuration.
   ========================================================================== */

var currentDb;
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  currentDb = 'mongodb://localhost/project-mercury';
}
else {
  currentDb = process.env.MONGOLAB_URI;
}
console.log('currentDb',currentDb);
mongoose.connect(currentDb);
mongoose.connection.on('error', function() {
  console.error('✗ MongoDB Connection Error. Please make sure MongoDB is running.');
});
module.exports.db = mongoose.connect;


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'),{
  maxage: process.env.ASSET_EXPIRES || 0
}));

// set browser caching on GETs
app.use(function (req, res, next) {
  // TODO: add error checking so we don't cache error responses...
  // if (! ('JSONResponcs' in res) ) {
  //   return next();
  // }
  var apiExpires = process.env.API_EXPIRES || 0;
  res.setHeader('Cache-Control', 'public, max-age=' + apiExpires);
  return next();
});

app.use('/', routes);
app.use('/perf', perf);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
