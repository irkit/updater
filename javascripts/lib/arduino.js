'use strict';
var serialport = require("serialport-electron")
,   async      = require("async")
,   pulser     = require("./pulser")
;

module.exports = {
  pulseDTRAndWaitForNewPort: function(port_name, wait_milliseconds, progress, completion) {
    serialport.list( function(err, before_ports) {
      var found = before_ports.filter( function(before_port, index) {
        return before_port.comName === port_name;
      }).length;
      if (! found) {
        completion( "No port: " + port_name + " found" );
        return;
      }

      pulser.pulse( port_name, progress, function(err) {
        if (err) {
          completion( err );
          return;
        }
        waitForNewSerialPort( before_ports, wait_milliseconds, progress, function(err, port) {
          if (err) {
            completion( err );
            return;
          }
          if (! port) {
            var message = "Port not found within " + wait_milliseconds/1000 + " seconds";
            completion( message );
            return;
          }

          progress( "Detected new serialport: " + port.comName );
          completion( null, port.comName );
        });
      });
    });
  }
};

function waitForNewSerialPort (before_ports, wait_milliseconds, progress, completion) {
  var til = (new Date()).getTime() + wait_milliseconds;

  var new_port, serialport_err, ports = before_ports;
  async.until(
    function () {
      new_port = ports.filter( function(port, index) {
        return before_ports.every( function(before_port) {
          return before_port.comName !== port.comName;
        });
      })[0];
      if (new_port) {
        progress( "New port found: " + new_port.comName + "\n" );
        return true;
      }

      var now = (new Date()).getTime();
      if (now > til) {
        return true;
      }
      // Keep track of port that disappears
      before_ports = ports;
      return false;
    },
    function (callback) {
      progress( "." );
      setTimeout( function() {
        serialport.list( function(err, ports_) {
          serialport_err = err;
          ports          = ports_;
          callback();
        });
      }, 250 );
    },
    function (err) {
      completion( err, new_port );
    }
  );
}
