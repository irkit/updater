'use strict';
var path = require('path');
var util = require('util');
var irkit = require('./lib/irkit');
var async = require('async');
var github = require('./lib/github');
var arduino = require('./lib/arduino');
var Avrdude = require('./lib/avrdude');
var passwordExtractor = require("./lib/password_extractor");
var passwordReplacer = require("./lib/intelhex_replacer");
var versionExtractor = require("./lib/version_extractor");
var temp = require("temp");
temp.track(); // automatic cleanup

module.exports = {
  // callback(err, foundPort, availableRelease)
  onReady: function(callback) {
    var foundPort = null;
    var availableRelease = null;

    async.waterfall([
      irkit.serialports,
      function (irkitPorts, callback) {
        if (irkitPorts.length !== 1) {
          callback( "IRKit not connected. Connect IRKit with a USB cable to this machine and restart" );
          return;
        }

        foundPort = irkitPorts[0];

        callback(null);
      },
      function (callback) {
        // GET https://api.github.com/repos/irkit/device/releases
        github.releases('irkit','device', callback);
      },
      function (response, releases, callback) {
        var releasesWithAssets = releases.filter( function(release,index) {
          // if ( (release.assets.length > 0) && !release.prerelease ) { // TODO uncomment
          if ( release.assets.length > 0 ) {
            return true;
          }
          return false;
        });

        if (releasesWithAssets.length === 0) {
          callback( "No available versions found on https://github.com/irkit/device/releases" );
          return;
        }

        availableRelease = releasesWithAssets[0];

        callback(null);
      }
    ], function (err) {
      callback( err, foundPort, availableRelease );
    });
  },
  update: function (port, release, progress, completion) {
    function callProgressStep(message) {
      return function () {
        progress(message);

        // pass along arguments
        var args = Array.prototype.slice.call(arguments);
        var callback = args.pop();
        args.unshift(null); // error is null
        callback.apply(null, args);
      };
    }
    function sleepStep (sleep) {
      return function () {
        progress("Sleeping for " + sleep + " seconds\n");

        // pass along arguments
        var args = Array.prototype.slice.call(arguments);
        var callback = args.pop();
        args.unshift(null); // error is null
        setTimeout( function () {
          callback.apply(null, args);
        }, sleep * 1000 );
      };
    }

    var downloader = new github.Downloader(release);
    var hexFilePath = null;

    async.waterfall([
      callProgressStep( "Downloading "+release.name+" from "+release.url + "\n" ),
      downloader.download.bind(downloader),
      function (path, callback) {
        progress( "Successfully downloaded to "+path+"\n" );
        hexFilePath = path;
        callback();
      },
      callProgressStep( "Reading current firmware from IRKit\n" ),
      function (callback) {
        irkit.readFlash( port, 10000, progress, callback );
      },
      function (readHEXFilePath, callback) {
        progress( "Successfully read Flash into "+readHEXFilePath+"\n" );
        hexFilePath = readHEXFilePath;
        callback(null);
      },
      function (callback) {
        passwordExtractor.extract(hexFilePath, progress, callback);
      },
      function (password, callback) {
        progress( "Extracted original password "+password+"\n" );
        progress( "Replacing password in hex file\n" );

        var file = temp.openSync({ suffix: ".hex" }); // I know, I know but creating temp files are not gonna take much time
        passwordReplacer.replace( path.normalize(hexFilePath),
                                  "XXXXXXXXXX",
                                  password,
                                  file.path,
                                  progress,
                                  callback );
        hexFilePath = file.path;
      },
      sleepStep(5),
      function (callback) {
        irkit.writeFlash( port, hexFilePath, 10000, progress, callback );
      },
      sleepStep(5),
      callProgressStep( "Checking firmware\n" ),
      function (callback) {
        irkit.readFlash( port, 10000, progress, callback );
      },
      function (flashHEXPath, callback) {
        progress( "Extracting version\n" );
        versionExtractor.extract(flashHEXPath, progress, callback);
      },
      function (version, callback) {
        progress( "Read version: "+version+"\n" );
        if (! version.match("^3\.")) { // should be v3
            callback( "Invalid version!! " + version );
            return;
        }
        callback();
      }
    ], function (err) {
      completion(err);
    });
  }
};
