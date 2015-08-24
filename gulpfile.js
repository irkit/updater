'use strict';

var gulp = require('gulp');
var useref = require('gulp-useref');
var livereload = require('gulp-livereload');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var compass = require('gulp-compass');

gulp.task('watch', [ 'watch:sass' ], function () {
  livereload.listen();
});

gulp.task('watch:sass', function () {
  gulp.watch('sass/**/*.scss', ['build:sass']);
});

gulp.task('build:sass', function () {
  gulp.src('sass/**/*.scss')
    .pipe(compass({
      config_file: './config.rb',
      css: 'stylesheets',
      sass: 'sass',
      sourcemap: true
    }))
    .pipe(livereload())
  ;
});

gulp.task('build', [ 'build:sass' ], function () {
  return gulp.src('*.html')
    .pipe(useref())
    .pipe(gulp.dest('dist'))
  ;
});

gulp.task('default', [ 'build' ], function () {
});
