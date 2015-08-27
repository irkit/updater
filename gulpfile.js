'use strict';

var gulp = require('gulp');
var useref = require('gulp-useref');
var livereload = require('gulp-livereload');
var sass = require('gulp-sass');
var compass = require('gulp-compass');
var rename = require('gulp-rename');
var packager = require('electron-packager');
var del = require('del');
var runSequence = require('run-sequence');
var fs = require('fs');
var path = require('path');
var archiver = require('archiver');
var glob = require('glob');

var buildDir = 'build';
var distDir = 'dist';
var electronVersion = '0.30.4';

gulp.task('clean', function (done) {
  del([ buildDir, distDir ], done);
});

gulp.task('watch', [ 'watch:sass' ], function () {
  livereload.listen();
});

gulp.task('watch:sass', function () {
  gulp.watch('sass/**/*.scss', ['build:sass']);
});

var platformAndArchs = [ ['win32', 'ia32'], ['win32', 'x64'], ['darwin', 'x64'] ];
var distTasks = platformAndArchs.map( function (platformAndArch) {
  var platform = platformAndArch[0];
  var arch = platformAndArch[1];
  var appName = 'IRKit Updater';
  var appVersion = require('./package.json').version;
  var appPath = path.join(distDir, platform, [appName, platform, arch].join("-"));
  var taskName = [ 'dist', platform, arch ].join(":");
  gulp.task(taskName+":packager", function (done) {
    packager({
      dir: buildDir,
      name: appName,
      arch: arch,
      platform: platform,
      out: distDir + '/' + platform,
      version: electronVersion,
      icon: 'images/AppIcon.icns',
      'app-bundle-id': 'jp.maaash.irkitupdater',
      'app-version': appVersion,
      'version-string': {
        CompanyName: 'maaash.jp',
        FileDescription: appName,
        FileVersion: appVersion,
        ProductVersion: appVersion,
        ProductName: appName
      }
    }, done);
  });
  gulp.task(taskName+":copyserialnode", function (done) {
    // copy native module
    var src = path.join("etc", "serialport.node."+platform+"_"+arch);
    var dstfiles = glob.sync(appPath+"/**/serialport-electron/serialport.node");
    if (dstfiles.length !== 1) {
      done( "Expected dstfiles.length to be 1 but got: " + dstfiles.join(", ") );
      return null;
    }
    return gulp.src(src)
      .pipe(rename('serialport.node'))
      .pipe(gulp.dest(path.dirname(dstfiles[0])))
    ;
  });
  gulp.task(taskName+":zip", function (done) {
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
  });
  gulp.task(taskName, function (done) {
    runSequence( taskName+":packager",
                 taskName+":copyserialnode",
                 taskName+":zip",
                 done );
  });
  return taskName;
});
gulp.task('dist', function (done) {
  var tasks = [ 'clean', 'build', distTasks, done ];
  var flattened = Array.prototype.concat.apply([], tasks); // serialize distTasks too
  runSequence.apply( null, flattened );
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
