/**
 * JiraChecker looks for JIRA referneces in the
 * description of a PR and sets up hyperlinks.
 */

var Promise = require('promise'),
    JiraApi = require('jira').JiraApi,
    url = require('url'),
    _ = require('lodash');

/**
 * @param object issue
 *   The "issue" or "pull_request" from the payload.
 */
module.exports = function JiraChecker(jiraConfig, issue, repo_info) {

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
    var linksFromGithub = _.extend(getLinks(issue.title), getLinks(issue.body));

    if (_.isEmpty(linksFromGithub)) {
      return new Promise(function(r){r(null);});
    }

    // For each link, look up the corresponding issue and plug in the title
    return Promise.all(_.map(linksFromGithub, updateLinkTitle))
      .then(function(){
        return Promise.all(_.map(linksFromGithub, updateLinksFromJira));
      })
      .then(function(){
        return compose(linksFromGithub);
      });
  }

  /**
   * Lookup JIRA issue title and (if available) add it to the link text.
   */
  function updateLinkTitle(link) {
    return new Promise(function(resolve, reject){
      jira.findIssue(link.issue, function(err, issue){
        if (issue && issue.fields && issue.fields.summary) {
          link.label = link.issue + ': ' + issue.fields.summary;
        }
        resolve();
      });
    });
  }

  /**
   * Create backlinks from JIRA to Github
   */
  function updateLinksFromJira(link) {
    return new Promise(function(resolve, reject){
      jira.getRemoteLinks(link.issue, function(err, remoteLinks){
        if (err) {
          console.log('[JiraChecker] Failed to find remoteLinks from JIRA:', link.issue, err);
          resolve();
          return;
        }

        var remoteLink = _.find(remoteLinks, function(rl){
          return rl.object.url === issue.html_url;
        });
        if (remoteLink) {
          resolve();
          return;
        }

        var linkData = {
          "object": {
            "url" : issue.html_url,
            "title": 'PR: ' + repo_info.name + '#' + issue.number +': ' + issue.title,
            "icon" : {
                "url16x16": "https://github.com/favicon.ico"
            }
          }
        };

        jira.createRemoteLink(link.issue, linkData, function(err2, ign) {
          console.log('[JiraChecker] Create remote link: ', link.issue, issue.html_url, err2);
          resolve();
        });
      });
    });
  }

  function compose(linksFromGithub) {
    var buf = "These links appear to be related:\n\n";
    buf = buf + _.map(linksFromGithub, function(link){
      return ' * [' + markdownEscape(link.label) + '](' + link.url +')\n';
    }).join("");
    return buf;
  }

  function markdownEscape(value) {
    return value.replace(/([\*#\/\(\)\[\]\<\>])/g,'\\$1');
  }

  /**
   * Parse some prose for a list of references to JIRA projects.
   *
   * @param string blurb A big ball of english
   * @return object
   */
  function getLinks(blurb) {
    var links = {};
    _.each(lexer(blurb), function(word){
      var match = projectRegex.exec(word);
      if (match) {
        links[match[0]] = {
          issue: match[0],
          project: match[1],
          issueNum: match[2],
          label: match[0],
          url: jiraConfig.url + '/browse/' + match[0]
        };
      }
    });
    return links;
  }

  function lexer(blurb) {
    return blurb ? blurb.split(/([ ,;:\/\"\'\<\>!\?\.\(\)\[\]\r\n\t]+)/) : [];
  }

  return {
    check: check
  };
};
