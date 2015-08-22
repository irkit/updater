var path = require("path")
,   exec = require("child_process").exec
,   os   = require("os")
;

function executable() {
  var platform = os.platform();
  var arch = os.arch();
  var basename = "";
  if ((platform == "darwin") && (arch == "x64")) {
    basename = "pulser_darwin_amd64";
  }
  else if ((platform == "win32") && (arch == "ia32")) {
    basename = "pulser_windows_386.exe";
  }
  else {
    throw( "platform or architecture not supported!" );
  }
  return path.join(__dirname, "..", "bin", basename);
}

module.exports = {
  executable: executable,
  pulse: function( port, progress, completion ) {
    var command = [path.normalize(executable()), port].join(" ")
    ;
    progress( "Will run: " + command + "\n" );

    var child = exec(command, function (err, stdout, stderr) {
      if (err !== null) {
        progress( stdout );
        progress( stderr );
        completion( err.code );
        return;
      }
      completion( null, stdout );
    });
  }
};
