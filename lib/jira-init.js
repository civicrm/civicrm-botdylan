/**
 * This is a thin wrapper around the 'jira' API which initializes
 * JIRA based on a config array.
 *
 * This includes various workarounds -- e.g. autodetecting port# and
 * supporting subdir (where JIRA is not deployed at root of a domain).
 *
 * Usage:
 * var jira = require('lib/jira-init.js')(jiraConfig);
 */
var Promise = require('promise'),
    JiraApi = require('jira').JiraApi,
    url = require('url'),
    _ = require('lodash');

/**
 * @param Object jiraConfig:
 *   - url: string, base URL of the JIRA instance
 *   - username: string
 *   - password: strin
 *   - version: (default 2)
 */
module.exports = function JiraInit(jiraConfig) {
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
