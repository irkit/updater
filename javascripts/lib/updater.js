'use strict';
var path = require('path');
var irkit = require('./irkit');
var async = require('async');
var github = require('./github');
var passwordExtractor = require("./password_extractor");
var passwordReplacer = require("./intelhex_replacer");
var versionExtractor = require("./version_extractor");
var eepromPasswordExtractor = require("./eeprom_password_extractor");
var temp = require("temp");
temp.track(); // automatic cleanup

var Translator = require('./translator');
var t = new Translator(['ja']);
t.setLanguage( navigator.language );

module.exports = {
  // callback(err, foundPort, availableRelease)
  onReady: function(callback) {
    var foundPort = null;
    var availableRelease = null;

    async.waterfall([
      irkit.serialports,
      function (irkitPorts, callback) {
        if (irkitPorts.length !== 1) {
          callback( t.gettext("IRKit not connected. Connect IRKit with a USB cable to this machine and restart") );
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
          callback( t.gettext("No available releases found on https://github.com/irkit/device/releases") );
          return;
        }

        availableRelease = releasesWithAssets[0];

        callback(null);
      }
    ], function (err) {
      callback( err, foundPort, availableRelease );
    });
  },
  // progress( message )
  // completion( error, fromVersion, toVersion )
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
    var downloadedHexFilePath = null;
    var beforeHexFilePath = null;
    var writingHexFilePath = null;
    var fromVersion = null;
    var toVersion = null;
    var password = null;

    async.waterfall([
      callProgressStep( "Downloading "+release.name+" from "+release.url + "\n" ),
      downloader.download.bind(downloader),
      function (path, callback) {
        progress( "Successfully downloaded to "+path+"\n" );
        downloadedHexFilePath = path;
        callback();
      },
      callProgressStep( "Reading current firmware from IRKit\n" ),
      function (callback) {
        irkit.readFlash( port, 10000, progress, callback );
      },
      function (readHEXFilePath, callback) {
        progress( "Successfully read Flash into "+readHEXFilePath+"\n" );
        beforeHexFilePath = readHEXFilePath;
        callback();
      },
      function (callback) {
        progress( "Extracting current version\n" );
        versionExtractor.extract(beforeHexFilePath, progress, function (err, version) {
          if (err !== null) {
            progress( "Failed to extract current version, but continuing\n" );
            callback(null, "Unknown");
          }
          else {
            callback(null, version);
          }
        });
      },
      function (version, callback) {
        progress( "\nCurrent version: "+version+"\n" );
        fromVersion = version;
        callback();
      },
      function (callback) {
        passwordExtractor.extract(beforeHexFilePath, progress, function (err, password) {
          if (err === null) {
            callback( null, password );
            return;
          }

          // Wi-Fi AP password wasn't found in Flash,
          // we're going to search for it in EEPROM

          var eepromHexFile = null;
          var eepromPassword = null;
          
          async.waterfall([
            sleepStep(5),
            function (callback) {
              progress( "Searching EEPROM for password\n" );
              irkit.readEEPROM( port, 10000, progress, callback );
            },
            function (readHEXFilePath, callback) {
              progress( "Successfully read EEPROM into "+readHEXFilePath+"\n" );
              eepromPasswordExtractor.extract( readHEXFilePath, progress, callback );
            },
            function (password, callback) {
              if (password.match(/^[0-9X]{10}$/)) {
                callback( null, password );
              }
              else {
                callback( "Password not found in EEPROM\n" );
              }
            }
          ], callback);
        });
      },
      function (password_, callback) {
        progress( "\nExtracted original password "+password_+"\n" );
        progress( "Replacing password in hex file\n" );

        password = password_;

        var file = temp.openSync({ suffix: ".hex" }); // I know, I know but creating temp files are not gonna take much time
        writingHexFilePath = file.path;
        passwordReplacer.replace( path.normalize(downloadedHexFilePath),
                                  "XXXXXXXXXX",
                                  password,
                                  writingHexFilePath,
                                  progress,
                                  callback );
      },
      sleepStep(5),
      function (callback) {
        progress( "Writing new firmware\n" );
        irkit.writeFlash( port, writingHexFilePath, 10000, progress, callback );
      },
      sleepStep(5),
      function (callback) {
        progress( "Checking firmware\n" );
        irkit.readFlash( port, 10000, progress, callback );
      },
      function (flashHEXPath, callback) {
        progress( "Extracting written version\n" );
        versionExtractor.extract(flashHEXPath, progress, callback);
      },
      function (version, callback) {
        progress( "\nRead version: "+version+"\n" );
        toVersion = version;

        var readVersion = version.split(".");
        var downloadedVersion = release.tag_name.replace(/^v/,"").split(".");
        if ((readVersion[0] == downloadedVersion[0]) &&
            (readVersion[1] == downloadedVersion[1]) &&
            (readVersion[2] == downloadedVersion[2])) {
          callback();
        }
        else {
          callback( "Invalid version!!\n" +
                    "Version expected to be " + downloadedVersion.join(".") + " but got " + version );
        }
      }
    ], function (err) {
      completion(err, fromVersion, toVersion, password);
    });
  }
};
