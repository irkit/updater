'use strict';
var util = require('util');
var irkit = require('./lib/irkit');
var async = require('async');
var serialport = require('serialport-electron');
var github = require('./lib/github');

module.export = {
  // callback(err, foundPort, availableRelease)
  onReady: function(callback) {
    var foundPort = null;
    var availableRelease = null;
    
    async.waterfall([
      irkit.serialports,
      function (irkitPorts, callback) {
        if (irkitPorts.length !== 1) {
          callback( "Number of IRKit ports expected to be 1 but got: "+util.format("%j", irkitPorts) );
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
          if ( (release.assets.length > 0) && !release.prerelease ) {
            return true;
          }
          return false;
        });

        if (releasesWithAssets.length <= 1) {
          callback( "No available versions found" );
          return;
        }

        availableRelease = releasesWithAssets[0];
        
        callback(null);
      }
    ], function (err) {
      callback( err, foundPort, availableRelease );
    });
  },
  update: function (port, release, callback) {
    async.waterfall([
      (new github.Downloader(release)).download,
      function (path, callback) {
      }
    ], function (err) {
    });
  }
};
