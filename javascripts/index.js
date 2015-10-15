'use strict';
var path = require('path');
var remote = require('remote');
var ejs = require('ejs');
var updater = require('./javascripts/lib/updater');
var Translator = require('./javascripts/lib/translator');
var t = new Translator(['ja']);
t.setLanguage( navigator.language );

window.onload = function () {

  $("#loading").show();
  updater.onReady(function(err, foundPort, availableRelease) {
    $("#loading").hide();
    if (err !== null) {
      showErrorMessage(err);
      return;
    }
    if (foundPort === null) {
      showErrorMessage( t.gettext("IRKit not connected. Connect IRKit with a USB cable to this machine and restart") );
      return;
    }
    if (availableRelease === null) {
      showErrorMessage( t.gettext("No available releases found on https://github.com/irkit/device/releases") );
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

  if ((typeof enableDevTools !== 'undefined') && enableDevTools) {
    remote.getCurrentWindow().openDevTools();
  }
};

function showUpdateView(port, release) {
  $("#update").show();
  $("#update-label-port").text(t.gettext("IRKit connected on port"));
  $("#update-port").text(port);
  $("#update-label-release").text(t.gettext("Updating to version"));
  $("#update-release").text(release.name);
  $("#update-error-message").text(t.gettext("Update failed! Please re-connect IRKit and try again"));
  $("#update-button").click( function () {
    $("#update-button").attr( "disabled", true );
    $("#update-log-container").show();
    $(".update-result-alert").hide();
    updater.update(port, release,
                   function (progress) {
                     appendUpdateLog(progress);
                   },
                   function (error, fromVersion, toVersion, password) {
                     if (error === null || error === undefined) {
                       appendUpdateLog("Finished successfully!\n");
                       $("#update-success").show();
                       var template = t.gettext("Update from <%= fromVersion %> to <%= toVersion %> finished successfully!<br />IRKit's Wi-Fi access point password is <strong><%= password %></strong>");
                       $("#update-success-message").
                         html(ejs.render(template, {
                           fromVersion: fromVersion,
                           toVersion: toVersion,
                           password: password
                         }));
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

