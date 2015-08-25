'use strict';
var path    = require("path")
,   command = require("./command")
;

module.exports = {
  extract: function( in_hex, progress, completion ) {
    var exec = path.normalize(command.executable("version-extractor"))
    ,   args = [ in_hex ]
    ;
    var process = command.run(exec, args, progress, completion);
    var version = "";
    process.on("exit", function (code) {
      if (code === 0) {
        completion(null, version);
      }
    });
    process.stdout.on("data", function (data) {
      version += data;
    });
  }
};
