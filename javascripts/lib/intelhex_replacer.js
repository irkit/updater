'use strict';
var path    = require("path")
,   command = require("./command")
;

module.exports = {
  replace: function( in_hex, from_string, to_string, out_hex, progress, completion ) {
    var exec = path.normalize(command.executable("intelhex"))
    ,   args = [
      "--from", from_string,
      "--to",   to_string,
      "--out",  out_hex,
        in_hex
    ];
    var process = command.run(exec, args, progress, completion);
    process.on("exit", function (code) {
      if (code === 0) {
        completion();
      }
    });
  }
};
