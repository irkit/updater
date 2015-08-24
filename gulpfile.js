'use strict';

var gulp = require('gulp');
var useref = require('gulp-useref');
var livereload = require('gulp-livereload');
var sass = require('gulp-sass');
var compass = require('gulp-compass');
var packager = require('electron-packager');
var del = require('del');
var runSequence = require('run-sequence');

var buildDir = 'build';
var distDir = 'dist';

gulp.task('clean', function (done) {
  del([ buildDir, distDir ], done);
});

gulp.task('watch', [ 'watch:sass' ], function () {
  livereload.listen();
});

gulp.task('watch:sass', function () {
  gulp.watch('sass/**/*.scss', ['build:sass']);
});

var packageTasks = [ 'win32', 'darwin' ].map( function (platform) {
  var taskName = 'package:' + platform;
  gulp.task(taskName, [ 'build' ], function (done) {
    packager({
      dir: buildDir,
      name: 'IRKit Updater',
      arch: 'x64', // TODO 32bit for win32
      platform: platform,
      out: distDir + '/' + platform,
      version: '0.30.4'
    }, done);
  });
  return taskName;
});
gulp.task('package', function (done) {
  runSequence( 'clean',
               'build',
               packageTasks,
               done );
});

gulp.task('build:sass', function () {
  return gulp.src('sass/**/*.scss')
    .pipe(compass({
      config_file: './config.rb',
      css: 'stylesheets',
      sass: 'sass',
      sourcemap: true
    }))
    .pipe(gulp.dest(buildDir+"/stylesheets"))
    .pipe(livereload())
  ;
});

gulp.task('build:html', function () {
  return gulp.src('*.html')
    .pipe(useref())
    .pipe(gulp.dest(buildDir))
  ;
});

gulp.task('build', [ 'build:html', 'build:sass' ], function () {
});

gulp.task('default', [ 'build' ], function () {
});
