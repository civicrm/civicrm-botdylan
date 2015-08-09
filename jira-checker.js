/**
 * JiraChecker looks for JIRA referneces in the
 * description of a PR and sets up hyperlinks.
 */

var Promise = require('promise'),
    JiraApi = require('jira').JiraApi,
    url = require('url'),
    _ = require('lodash');

/**
 * @param object pull_request
 */
module.exports = function JiraChecker(jiraConfig, pull_request) {

  var projectRegex = new RegExp('^(' + jiraConfig.projects.join('|') + ')-([0-9]+)$');
  var jira = createJira();
  var findIssue = Promise.denodeify(jira.findIssue);

  function createJira() {
    var parts = url.parse(jiraConfig.url);
    if (!parts.port) {
      parts.port = (parts.protocol === 'https:' ? 443: 80);
    }
    var jira = new JiraApi(parts.protocol, parts.hostname, parts.port, jiraConfig.username, jiraConfig.password, jiraConfig.version ? jiraConfig.version : '2');
    var origMakeUri = jira.makeUri;
    jira.makeUri = function(pathname, altBase, altApiVersion) {
      var newBase = parts.path.trimLeft('/') + '/' + (altBase ? altBase : 'rest/api/');
      return origMakeUri.call(this, pathname, newBase, altApiVersion);
    };
    return jira;
  }

  /**
   * @return Promise<string|null> message
   */
  function check() {
    var links = _.union(getLinks(pull_request.body), getLinks(pull_request.title));

    // For each link, look up the corresponding issue and plug in the title
    return new Promise(function(r){
      if (_.isEmpty(links)) {
        r(null);
        return;
      }
      r(Promise
        .all(_.map(links, function(link){
          return new Promise(function(resolve, reject){
            jira.findIssue(link.issue, function(err, issue){
              if (issue && issue.fields && issue.fields.summary) {
                link.label = link.issue + ': ' + issue.fields.summary;
              }
              resolve();
            });
          });
        }))
        .then(function(){
          return compose(links);
        })
      );
    });
  }

  function compose(links) {
    var buf = "These links appear to be related:\n\n";
    buf = buf + _.map(links, function(link){
      return ' * [' + markdownEscape(link.label) + '](' + link.url +')\n';
    }).join("");
    return buf;
  }

  function markdownEscape(value) {
    return value.replace(/([\*#\/\(\)\[\]\<\>])/g,'\\$1');
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
          issue: match[0],
          project: match[1],
          issueNum: match[2],
          label: match[0],
          url: jiraConfig.url + '/browse/' + match[0]
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
