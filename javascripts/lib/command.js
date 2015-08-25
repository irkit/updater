'use strict';
var path  = require("path")
,   spawn = require("child_process").spawn
,   os    = require("os")
;

function executable(base) {
  var platform = os.platform();
  var arch = os.arch();
  var basename = "";
  if ((platform == "darwin") && (arch == "x64")) {
    basename = base + "_darwin_amd64";
  }
  else if ((platform == "win32") && (arch == "ia32")) {
    basename = base + "_windows_386.exe";
  }
  else if ((platform == "win32") && (arch == "x64")) {
    basename = base + "_windows_amd64.exe";
  }
  else {
    throw( "platform or architecture not supported!" );
  }
  return path.join(__dirname, "..", "..", "bin", basename);
}

function run(exec, args, progress, completion) {
  progress( "Will run: " + [exec, args.join(" ")].join(" ") + "\n" );

  var called = false;

  var process = spawn(exec, args);
  process.stdout.setEncoding("utf8");
  process.stderr.setEncoding("utf8");
  process.on("exit", function(code) {
    if (code !== 0) {
      if (!called) {
        called = true;
        completion( path.basename(exec) + " failed with exit code: " + code );
      }
    }
    // caller will call completion handler on success
  });
  process.on("error", function(err) {
    if (!called) {
      called = true;
      completion( "Error: " + err );
    }
    else {
      progress( "Error: " + err );
    }
  });
  process.stdout.on("data", function(data) {
    progress( data );
  });
  process.stderr.on("data", function(data) {
    progress( data );
  });
  return process;
}

module.exports = {
  executable: executable,
  run: run
};
