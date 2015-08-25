'use strict';
var path    = require("path")
,   command = require("./command")
;

module.exports = {
  extract: function( in_hex, progress, completion ) {
    var exec = path.normalize(command.executable("extractor"))
    ,   args = [ in_hex ]
    ;
    var process = command.run(exec, args, progress, completion);
    var password = "";
    process.stdout.on("data", function (data) {
      password += data;
    });
    process.on("exit", function (code) {
      if (code === 0) {
        completion(null, password);
      }
    });
  }
};
