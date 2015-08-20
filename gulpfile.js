var gulp         = require('gulp');
var watch        = require('gulp-watch');
var stylus       = require('gulp-stylus');
var browserSync  = require('browser-sync');
var autoprefixer = require('gulp-autoprefixer');
var minifyCSS    = require('gulp-minify-css');
var notify       = require('gulp-notify');
var gutil        = require('gulp-util');
var uglify       = require('gulp-uglifyjs');
var rename       = require('gulp-rename');
var concat       = require('gulp-concat');
var vulcanize    = require('gulp-vulcanize');

// src sets
var cssBundle = [
  './public/components/materialize/dist/css/materialize.min.css',
  './public/stylesheets/styl/main.styl'
];
var jsBundle = [
  './public/components/jquery/dist/jquery.min.js',
  './public/components/materialize/dist/js/materialize.min.js'
];
var webCompBundle = [
  //'./public/components/polymer/polymer.html',
  //'./public/components/polymer/layout.html',
  './public/components/perf-metrics/perf-metrics.html',
  './public/components/perf-offenders/perf-offenders.html'
];

gulp.task('stylus', function () {
  gulp.src(cssBundle)
    .pipe(stylus({compress: true}).on('error', gutil.log))
    .pipe(autoprefixer('last 10 versions', 'ie 9'))
    .pipe(minifyCSS({keepBreaks: false}))
    .pipe(concat('main.min.css'))
    .pipe(gulp.dest('./public/stylesheets'))
    .pipe(notify('Stylus Compiled, Prefixed and Minified'));
});

gulp.task('js-bundle',function(){
  gulp.src(jsBundle)
    .pipe(uglify('app.min.js'))
    .pipe(gulp.dest('./public/javascripts'))
    .pipe(notify('JS Bundle Concatenated & Uglified'));
});

gulp.task('webcomponents',function(){
  var destDir = 'public/webcomponents';
  return gulp.src(webCompBundle)
    .pipe(vulcanize({
      dest:destDir,
      strip: true
    }))
    .pipe(gulp.dest(destDir))
    .pipe(notify('Webcomponents Bundle Vulcanized!'));
});

// watches
gulp.task('watch', function () {
  gulp.watch('public/stylesheets/styl/*', ['stylus']);
  gulp.watch('public/components/**/*.html', ['webcomponents']);
});

// build tasks
gulp.task('build',['js-bundle','stylus','webcomponents']);

// default tasks
gulp.task('default',['build','watch']);