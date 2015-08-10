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
module.exports = function JiraChecker(jiraConfig, issue, repo_info, github) {

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
   * Get a list of hyperlinks for JIRA issues referenced by the Github issue.
   * Load key details about each issue (such as title).
   *
   * @return Promise<object>
   */
  function getLinks() {
    var linksFromGithub = extractLinks(issue.title + "\n" + issue.body);
    return Promise.all(_.map(linksFromGithub, resolveLinkTitle))
      .then(function(){
        return linksFromGithub;
      });
  }

  /**
   * Update Github issue to include hyperlinks for JIRA issue(s).
   *
   * @return Promise<void>
   */
  function addMissingLinks(links) {
    var missingLinks = _.filter(links, function(link){
      return issue.body.indexOf(link.url) < 0;
    });

    var newBody = issue.body.trimRight() + "\n\n---\n\n" + compose(missingLinks);
    if (_.isEmpty(missingLinks)) {
      return new Promise(function(r){r();});
    }

    console.log('[JiraChecker] addMissingLinks:', newBody);
    return invokeApi(github.issues.edit, {number: issue.number, body: newBody});
  }

  /**
   * Lookup JIRA issue title and (if available) add it to the link text.
   */
  function resolveLinkTitle(link) {
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
   * Create backlinks from JIRA to Github for all JIRA references.
   * @return Promise<null>
   */
  function updateLinksFromJira(links) {
    return Promise.all(_.map(links, updateLinkFromJira));
  }

  /**
   * Create backlinks from JIRA to Github
   */
  function updateLinkFromJira(link) {
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
    var buf = ""; // "These links appear to be related:\n\n";
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
  function extractLinks(blurb) {
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

  /**
   * Wrapper for 'github' API. Automatically set owner+repo details,
   * and return call as a promise.
   *
   * ex: invokeApi(github.issues.getComments, {number: 123})
   *   .then(function(comments)...);
   *
   * @return Promise
   */
  function invokeApi(action, msg) {
    var func = Promise.denodeify(action);
    var args = _.extend({}, {
      user: repo_info.owner,
      repo: repo_info.name
    }, msg);
    return func(args);
  }

  return {
    addMissingLinks: addMissingLinks,
    getLinks: getLinks,
    updateLinksFromJira: updateLinksFromJira
  };
};
