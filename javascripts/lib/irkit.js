'use strict';
var path = require('path');
var serialport = require("serialport-electron");
var arduino = require("./arduino");
var Avrdude = require("./avrdude");
var async = require("async");
var temp = require("temp");
temp.track(); // automatic cleanup
var util = require('util');
var debuglog = util.debuglog('irkit');

function serialports (callback) {
  serialport.list( function (err, ports) {
    debuglog('serialport.list err: %j, ports: %j', err, ports);
    if (err) {
      callback( err, null );
      return;
    }
    callback( null, ports.filter(isIRKitPort).map(function(port) { return port.comName; }) );
  });
}

function isIRKitPort (port) {
  return port.pnpId.match( /PID_6085/ ) || // Windows IRKit
         port.pnpId.match( /PID_8036/ ) || // Windows Arduino Leonardo
         (port.productId === "0x6085") || // MacOS IRKit
         (port.productId === "0x8036"); // MacOS Arduino Leonardo
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
      avrdude.run(args, progress, callback);
    },
  ], function (err) {
    completion( err, file.path );
  });
}

function writeFlash(port, newHexPath, timeout, progress, completion) {
  async.waterfall([
    function (callback) {
      arduino.pulseDTRAndWaitForNewPort( port, timeout, progress, callback );
    },
    function (newPort, callback) {
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
      avrdude.run(args, progress, callback);
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
