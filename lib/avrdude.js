'use strict';
var util       = require("util")
,   events     = require("events")
,   stream     = require("stream")
,   spawn      = require("child_process").spawn
,   debuglog   = util.debuglog('avrdude');
;

var Avrdude = function (command) {
  events.EventEmitter.call(this);
  this.command = command;
};
util.inherits(Avrdude,events.EventEmitter);

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

module.exports = Avrdude;
