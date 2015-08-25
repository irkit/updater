'use strict';
var path    = require("path")
,   command = require("./command")
;

module.exports = {
  pulse: function( port, progress, completion ) {
    var exec = path.normalize(command.executable("pulser"))
    ,   args = [ port ]
    ;
    var process = command.run(exec, args, progress, completion);
    process.on("exit", function (code) {
      if (code === 0) {
        completion();
      }
    });
  }
};
