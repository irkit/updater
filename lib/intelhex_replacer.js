var path  = require("path")
,   spawn = require("child_process").spawn
,   os    = require("os")
;

function executable() {
  var platform = os.platform();
  var arch = os.arch();
  var basename = "";
  if ((platform == "darwin") && (arch == "x64")) {
    basename = "intelhex_darwin_amd64";
  }
  else if ((platform == "win32") && (arch == "ia32")) {
    basename = "intelhex_windows_386.exe";
  }
  else {
    throw( "platform or architecture not supported!" );
  }
  return path.join(__dirname, "..", "bin", basename);
}

module.exports = {
  executable: executable,
  replace: function( in_hex, from_string, to_string, out_hex, progress, completion ) {
    var command = path.normalize(executable())
    ,   args    = [
      "--from", from_string,
      "--to",   to_string,
      "--out",  out_hex,
        in_hex
    ];
    progress( "Will run: " + [command, args.join(" ")].join(" ") + "\n" );

    var process = spawn(command, args);
    process.stdout.setEncoding("utf8");
    var all = "";
    process.on("close", function(code) {
      completion( code );
    });
    process.on("error", function(err) {
      progress( "Error: " + err );
    });
    process.stdout.on("data", function(data) {
      progress( data );
    });
    return process;
  }
};
