var serialport = require("serialport-electron");

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

module.exports = {
  isIRKitPort: isIRKitPort,
  serialports: serialports,
  waitPorts: waitPorts
};
