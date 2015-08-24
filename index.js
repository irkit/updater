var updater = require('./lib/updater');
window.onload = function () {

  $("#loading").show();
  updater.onReady(function(err, foundPort, availableRelease) {
    $("#loading").hide();
    if (err !== null) {
      showErrorMessage(err);
      return;
    }
    if (foundPort === null) {
      showErrorMessage( "IRKit not connected. Connect IRKit with a USB cable to this machine and restart" );
      return;
    }
    if (availableRelease === null) {
      showErrorMessage( "No available releases found on github.com/irkit/device/releases" );
      return;
    }

    showUpdateView(foundPort, availableRelease);
  });

  $('[data-toggle="tooltip"]').tooltip();
  $("#update-log-clear").click( function() {
    $("#update-log").html("<br />");
  });
  $("#update-log-copy").click( function() {
    var log = $("#update-log").html().replace(/<br>/gm, "\n");
    require("clipboard").writeText( log );
    var copy = $("#update-log-copy");
    copy
      .attr("title", "Copied!")
      .tooltip("fixTitle")
      .tooltip("show")
      .on("hidden.bs.tooltip", function() {
        copy
          .attr("title", "Copy to clipboard")
          .tooltip("fixTitle");
      });
  });
};

function showUpdateView(port, release) {
  $("#update").show();
  $("#update-port").text(port);
  $("#update-release").text(release.name);
  $("#update-button").click( function () {
    $("#update-button").attr( "disabled", true );
    $(".update-log-control").show();
    updater.update(port, release,
                      function (progress) {
                        appendUpdateLog(progress);
                      },
                      function (error) {
                        if (error === null || error === undefined) {
                          appendUpdateLog("Finished successfully!\n");
                          $("#update-success").show();
                        }
                        else {
                          appendUpdateLog("Finished with error: "+error+"\n");
                          $("#update-button").text( "Retry" );
                          $("#update-button").attr( "disabled", false );
                          $("#update-error").show();
                        }
                      });
  });
}

function appendUpdateLog(message) {
  message.
    split(/\n/).
    map(function (val, index) {
      return document.createTextNode(val);
    }).
    map(function (line, index, array) {
      $("#update-log").append(line);
      if (index !== array.length-1) {
        $("#update-log").append("<br />");
      }
    });
}

function showErrorMessage(message) {
  $("#error").show();
  $("#error-message").text(message);
}

