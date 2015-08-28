'use strict';

var path = require('path');

var Translator = function (files) {
  this.language = null;
  this.languages = {};
  this._parseFiles(files);
};

Translator.prototype._parseFiles = function (files) {
  var slf = this;
  files.forEach( function (file) {
    var lang = path.basename(file, '.json');
    slf.languages[ lang ] = slf._parseFile(file)[ lang ];
  });
};

Translator.prototype._parseFile = function (file) {
  return require(file);
};

Translator.prototype.gettext = function (msgid) {
  if (this.language === null) {
    return msgid;
  }
  else if (msgid === "") {
    return ""; // don't accidentally show "Project-Id-Version ... "
  }
  else if ((typeof this.languages[ this.language ] !== 'undefined') &&
           this.languages[ this.language ][ msgid ]) {
    return this.languages[ this.language ][ msgid ][ 1 ];
  }
  return msgid;
};

Translator.prototype.setLanguage = function (language) {
  this.language = language;
};

module.exports = Translator;
