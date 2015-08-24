var path = require('path');
var serialport = require("serialport-electron");
var arduino = require("./arduino");
var Avrdude = require("./avrdude");
var async = require("async");
var temp = require("temp");
temp.track(); // automatic cleanup

function serialports (callback) {
  serialport.list( function (err, ports) {
    if (err) {
      callback( err, null );
      return;
    }
    callback( null, ports.filter(isIRKitPort).map(function(port) { return port.comName; }) );
  });
}

function isIRKitPort (port) {
  return port.pnpId.match( /PID_6085/ ) || // Windows
         (port.productId === "0x6085"); // MacOS
}

function waitPorts (timeout, callback) {
  var now = new Date();

  function retryIfNeeded (err, ports) {
    if ((err === null) && (ports.length === 0) && (new Date() - now < timeout)) {
      setTimeout( function () {
        serialports( retryIfNeeded );
      }, 1000 );
      return;
    }
    callback( err, ports );
  }

  serialports( retryIfNeeded );
}

function readFlash (port, timeout, progress, completion) {
  var file = temp.openSync({ suffix: ".hex" }); // I know, I know but creating temp files are not gonna take much time

  async.waterfall([
    function (callback) {
      arduino.pulseDTRAndWaitForNewPort( port, timeout, progress, callback );
    },
    function (newPort, callback) {
      var called = false;

      var avrdude = new Avrdude();
      var args = [
        "-C" + avrdude.config(),
        "-patmega32u4",
        "-cavr109",
        "-P" + newPort,
        "-b57600",
        "-D",
        "-U",
        "flash:r:" + path.resolve(file.path) + ":i"
      ];
      var process = avrdude.run(args);
      process.stderr.setEncoding('utf8');
      process.stderr.on("data", function (chunk) {
        progress( chunk );
      });
      process.on("error", function (err) {
        if (!called) {
          called = true;
          callback( err );
        }
      });
      process.on("exit", function (code, signal) {
        if (code !== 0) {
          if (!called) {
            called = true;
            callback( "avrdude failed with exit code: "+code );
          }
        }
        else { // success
          callback();
        }
      });
    },
  ], function (err) {
    completion( err, file.path );
  });
}

function writeFlash(port, newHexPath, timeout, progress, completion) {
  async.waterfall([
    function (callback) {
      progress( "Writing new firmware\n" );
      arduino.pulseDTRAndWaitForNewPort( port, timeout, progress, callback );
    },
    function (newPort, callback) {
      var called = false;

      var avrdude = new Avrdude();
      var args = [
        "-C" + avrdude.config(),
        "-patmega32u4",
        "-cavr109",
        "-P" + newPort,
        "-b57600",
        "-e", // erase whole Flash
        "-U",
        "flash:w:" + path.resolve(newHexPath) + ":i"
      ];
      var process = avrdude.run(args);
      process.stderr.setEncoding('utf8');
      process.stderr.on("data", function (chunk) {
        progress( chunk );
      });
      process.on("error", function (err) {
        if (!called) {
          called = true;
          callback( err );
        }
      });
      process.on("exit", function (code, signal) {
        if (code !== 0) {
          if (!called) {
            called = true;
            callback( "avrdude failed with exit code: "+code );
          }
        }
        else { // success
          callback();
        }
      });
    },
  ], function (err) {
    completion( err );
  });
}

module.exports = {
  isIRKitPort: isIRKitPort,
  serialports: serialports,
  waitPorts: waitPorts,
  readFlash: readFlash,
  writeFlash: writeFlash
};