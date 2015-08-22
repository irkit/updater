'use strict';
var path = require('path');
var util = require('util');
var irkit = require('./lib/irkit');
var async = require('async');
var github = require('./lib/github');
var arduino = require('./lib/arduino');
var Avrdude = require('./lib/avrdude');
var passwordExtractor = require("./lib/password_extractor");
var versionExtractor = require("./lib/version_extractor");

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
          // if ( (release.assets.length > 0) && !release.prerelease ) {
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
    function callProgress(message) {
      return function () {
        progress(message);

        // pass along arguments
        var args = Array.prototype.slice.call(arguments);
        var callback = args.pop();
        args.unshift(null); // error is null
        callback.apply(null, args);
      };
    }

    var downloader = new github.Downloader(release);
    var newFirmwarePath = null;

    async.waterfall([
      callProgress( "Downloading "+release.name+" from "+release.url + "\n" ),
      downloader.download.bind(downloader),
      function (path, callback) {
        progress( "Successfully downloaded to "+path+"\n" );
        newFirmwarePath = path;
        callback();
      },
      callProgress( "Reading current firmware from IRKit\n" ),
      function (callback) {
        irkit.readFlash( port, 10000, progress, callback );
      },
      function (flashHEXPath, callback) {
        progress( "Successfully read Flash into "+flashHEXPath+"\n" );
        callback(null, flashHEXPath);
      },
      function (flashHEXPath, callback) {
        passwordExtractor.extract(flashHEXPath, progress, callback);
      },
      function (password, callback) {
        progress( "Extracted original password "+password+"\n" );
        irkit.writeReplacingPassword( port, 10000, newFirmwarePath, password, progress, callback );
      },
      callProgress( "Checking firmware\n" ),
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
