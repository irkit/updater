'use strict';
var path    = require("path")
,   command = require("./command")
;

var Avrdude = function () {
};

Avrdude.prototype.run = function (args, progress, completion) {
  var avrdude = command.run(command.executable("avrdude"), args, progress, completion);
  var stderr = "";
  avrdude.stderr.on("data", function(data) {
    stderr += data;
    if ( stderr.match(/can't open device/) ) {
      avrdude.kill();
    }
    else if ( stderr.match(/programmer is not responding/) ) {
      // don't wait until retry fails
      avrdude.kill();
    }
  });
  avrdude.on("exit", function (code) {
    if (code === 0) {
      completion();
    }
  });
  return avrdude;
};

Avrdude.prototype.config = function () {
  return path.join(__dirname, "..", "..", "etc", "avrdude.conf");
};

module.exports = Avrdude;
