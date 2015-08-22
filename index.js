var controller = require('./controller');
window.onload = function () {

  $("#loading").show();
  controller.onReady(function(err, foundPort, availableRelease) {
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
};

function showUpdateView(port, release) {
  $("#update").show();
  $("#update-port").text(port);
  $("#update-release").text(release.name);
}

function showErrorMessage(message) {
  $("#error").show();
  $("#error-message").text(message);
}

