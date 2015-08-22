'use strict';
var util       = require("util")
,   events     = require("events")
,   stream     = require("stream")
,   spawn      = require("child_process").spawn
,   os         = require("os")
,   path       = require("path")
,   debuglog   = util.debuglog('avrdude');
;

var Avrdude = function () {
  events.EventEmitter.call(this);
  this.initialize.apply(this, arguments);
};
util.inherits(Avrdude,events.EventEmitter);

Avrdude.prototype.initialize = function () {
  this.command = this.makeCommand();
};
Avrdude.prototype.makeCommand = function () {
  var platform = os.platform();
  var arch = os.arch();
  var basename = "";
  if ((platform == "darwin") && (arch == "x64")) {
    basename = "avrdude.darwin.x64";
  }
  else if ((platform == "win32") && (arch == "ia32")) {
    basename = "avrdude.win32.ia32.exe";
  }
  else {
    throw( "platform or architecture not supported!" );
  }
  return path.join(__dirname, "..", "bin", basename);
};

Avrdude.prototype.run = function (args) {
  debuglog("will run: %s %s", this.command, args.join(" "));

  var avrdude = spawn(this.command, args);
  avrdude.stderr.setEncoding("utf8");
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
  return avrdude;
};

Avrdude.prototype.config = function () {
  return path.join(__dirname, "..", "etc", "avrdude.conf");
};

module.exports = Avrdude;
