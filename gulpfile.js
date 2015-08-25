'use strict';

var gulp = require('gulp');
var useref = require('gulp-useref');
var livereload = require('gulp-livereload');
var sass = require('gulp-sass');
var compass = require('gulp-compass');
var packager = require('electron-packager');
var del = require('del');
var runSequence = require('run-sequence');
var fs = require('fs');
var path = require('path');
var archiver = require('archiver');

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

var packageTasks = [ ['win32', 'ia32'], ['win32', 'x64'], ['darwin', 'x64'] ].map( function (platformAndArch) {
  var platform = platformAndArch[0];
  var arch = platformAndArch[1];
  var appName = 'IRKit Updater';
  var appVersion = require('./package.json').version;
  var taskName = [ 'package', platform, arch ].join(":");
  gulp.task(taskName, [ 'build' ], function (done) {
    packager({
      dir: buildDir,
      name: appName,
      arch: arch, // TODO 32bit for win32
      platform: platform,
      out: distDir + '/' + platform,
      version: '0.30.4'
    }, function (err, appPath) {
      if (err) {
        done(err);
        return null;
      }
      else {
        var dest = [appName, platform, arch, appVersion].join("-") + ".zip";
        var cwd = path.join(distDir, platform);
        var zip = archiver.create('zip', {});
        var output = fs.createWriteStream(path.join(cwd, dest));
        zip.pipe(output);
        zip.bulk([
          {
            expand: true,
            cwd: cwd,
            src: [path.basename(appPath) + "/**/*"],
            dot: true
          }
        ]);
        zip.finalize();
        return output;
      }
    });
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

gulp.task('build:scripts', function () {
  return gulp.src(['javascripts/**/*.js'], { base: '.' })
    .pipe(gulp.dest(buildDir))
  ;
});

gulp.task('build:modules', function () {
  var packageJSON = require('./package.json');
  var modules = Object.keys(packageJSON.dependencies);
  var srces = modules.map(function (module) {
    return "node_modules/"+module+"/**/*";
  });
  return gulp.src(srces, { base: '.' })
    .pipe(gulp.dest(buildDir))
  ;
});

gulp.task('build:etc', function () {
  return gulp.src(['etc/**', 'bin/**', 'fonts/**', 'images/**', 'package.json'], { base: '.' })
    .pipe(gulp.dest(buildDir))
  ;
});

gulp.task('build', [
  'build:html',
  'build:sass',
  'build:scripts',
  'build:modules',
  'build:etc'
], function () {
});

gulp.task('cleanbuild', function (done) {
  runSequence( 'clean',
               'build',
               done );
});

gulp.task('default', [ 'build' ], function () {
});
