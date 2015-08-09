/**
 * JiraChecker looks for JIRA referneces in the
 * description of a PR and sets up hyperlinks.
 */

var Promise = require('promise'),
    _ = require('lodash');

/**
 * @param object pull_request
 */
module.exports = function JiraChecker(jiraConfig, pull_request) {

  var projectRegex = new RegExp('^(' + _.keys(jiraConfig.projects).join('|') + ')-([0-9]+)$');

  /**
   * @return Promise<Array> messages
   */
  function check() {
    var links = _.union(getLinks(pull_request.body), getLinks(pull_request.title));
    console.log('[JiraChecker] Links: ', links);

    var msg = _.isEmpty(links) ? NULL : compose(links);
    console.log('[JiraChecker] Message: ', msg);
    return new Promise(function(r){r(msg);});
  }

  function compose(links) {
    var buf = "These links appear to be related:\n\n";
    buf = buf + _.map(links, function(link){
      return ' * [' + link.label + '](' + link.url +')\n';
    }).join("");
    return buf;
  }

  /**
   * @param string blurb A big ball of english
   * @return object
   */
  function getLinks(blurb) {
    var links = [];
    _.each(lexer(blurb), function(word){
      var match = projectRegex.exec(word);
      if (match) {
        links.push({
          label: match[0],
          url: jiraConfig.projects[match[1]] + '/browse/' + match[0]
        });
      }
    });
    return links;
  }

  function lexer(blurb) {
    return blurb.split(/([ ,;:\/\"\'\<\>!\?\.\(\)\[\]\r\n\t]+)/);
  }

  return {
    check: check
  };
};
