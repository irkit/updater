var controller = require('./controller');
window.onload = function () {
  $("#loading").show();
  controller.onReady(function(err, foundPort, availableRelease) {
    $("#loading").hide();
    $("#error").show();
    console.log(err, foundPort, availableRelease);

  });
};
