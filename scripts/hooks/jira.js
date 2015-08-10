var JiraChecker = require('../../lib/jira-checker.js');
var CommentManager = require('../../lib/comment-manager.js');
var _ = require('lodash');
var locks = require('../../lib/lock.js');

/**
 * Check the PR title and body for referneces to JIRA issues.
 * If found, bi-directional links (using Github comments and JIRA remote-links).
 */
module.exports = function githubJiraHook(bot, repo_info, payload) {
  if (!payload.pull_request && !payload.issue) {
    return;
  }

  var issueNumber = parseInt(payload.pull_request ? payload.pull_request.number : payload.issue.number);
  var jiraChecker = new JiraChecker(bot.options.jira, payload.pull_request || payload.issue, repo_info, bot.github);
  var commentManager = CommentManager(bot.github, bot.options.username, repo_info);

  // We're a bit promiscuous about accepting hooks. This is good for frequent updates
  // but leads to some redundant notifications.
  var lockName = 'jira:' + repo_info.full_name + ":" + issueNumber;
  if (!locks.acquire(lockName)) return;

  console.log('[GithubJiraHook] Check for JIRA references');
  var links = null;
  var p = jiraChecker.getLinks()
    .then(function(allLinks) {
      links = allLinks;
      console.log('[GithubJiraHook] Found links:', links);
      return jiraChecker.addMissingLinks(links);
    })
    .then(function(){
      return jiraChecker.updateLinksFromJira(links);
    })
    .finally(function(err){
      locks.release(lockName);
    })
    .done();

  return bot.isSimulated ? p : null;
};
