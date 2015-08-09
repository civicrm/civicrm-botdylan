/**
 * ToxicChecker looks for a .toxic.json file
 * determines if any matching changes have
 * been made.
 */

var Promise = require('promise'),
    _ = require('lodash'),
    exec = require('./my-exec.js'),
    fs = require('fs');

/**
 * @param string repoDir, local file system path
 * @param string fromRef, branch/tag/commit name
 * @param string toRef, branch/tag/commit name
 */
module.exports = function ToxicChecker(repoDir, fromRef, toRef) {

  /**
   * @return Promise<array> List of messages
   */
  function check() {
    var options = loadOptions();
    console.log('[ToxicChecker]', repoDir, fromRef, toRef,options);

    return getPhpChanges()
      .then(function(phpSymbols){
        var messageData = {};
        _.forEach(phpSymbols, function(phpSymbol) {
          var templateName = options.checks[phpSymbol];
          if (templateName && options.templates[templateName]) {
            if (!messageData[templateName]) messageData[templateName] = [];
            messageData[templateName].push(phpSymbol);
          }
        });

        var messages = {};
        _.forEach(messageData, function(badSymbols, templateName) {
          var message = options.templates[templateName];
          var escapedSymbols = _.map(badSymbols, function(s) {
            return '`' + s + '`';
          });
          message = message.replace(/\{SYMBOLS\}/g, conjunction('and', escapedSymbols));
          var messageName = 'civi-botdylan-toxic-' + templateName.replace(/[^a-zA-Z0-9]/g, '-');
          messages[messageName] = message;
        });
        return messages;
      });
  }

  function conjunction(conj, exprs) {
    switch (exprs.length) {
      case 1:
        return exprs[0];
      case 2:
        return exprs[0] + ' ' + conj + ' ' + exprs[1];
      default:
        return _.slice(exprs, 0, exprs.length-1).join(', ') +
          ', ' + conj + ' ' + _.last(exprs);
    }
  }

  /**
   * @return object Config settings
   */
  function loadOptions() {
    var options = {
      templates: {},
      checks: {}
    };
    if (fs.existsSync(repoDir + '/.toxic.json')) {
      _.extend(options, require(repoDir + '/.toxic.json'));
/*
      options.templates.ex =
        "<img alt=\"Please: Help save the fish from toxic code.\" src=\"https://civicrm.org/sites/civicrm.org/files/HazCode-Please.png\">\n\n" +
        "This pull-request modifies {SYMBOLS}. This code has been previously identified as hazardous. For advice on dealing with it, please review [Toxic Code Protocol](http://wiki.civicrm.org/confluence/display/CRM/Toxic+Code+Protocol).";
        */
    }
    return options;
  }

  function getPhpChanges() {
    return exec(repoDir, 'git-php-symbol-diff ' + exec.escape(fromRef) + ' ' + exec.escape(toRef))
      .then(function(r) {
        return _.filter(r.stdout.split("\n"), function(v){ return ! _.isEmpty(v);});
      });
  }

  // Return public API.
  return {
    check: check
  };
};
