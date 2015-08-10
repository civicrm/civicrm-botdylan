var JiraChecker = require('../../lib/jira-checker.js');
var CommentManager = require('../../lib/comment-manager.js');
var _ = require('lodash');

/**
 * Check the PR title and body for referneces to JIRA issues.
 * If found, bi-directional links (using Github comments and JIRA remote-links).
 */
module.exports = function githubJiraHook(bot, repo_info, payload) {
  if (!payload.pull_request && !payload.issue) {
    return;
  }

  var issueNumber = parseInt(payload.pull_request ? payload.pull_request.number : payload.issue.number);
  var jiraChecker = new JiraChecker(bot.options.jira, payload.pull_request || payload.issue, repo_info);
  var commentManager = CommentManager(bot.github, bot.options.username, repo_info);

  console.log('[GithubJiraHook] Check for JIRA references');
  var p = jiraChecker.check().then(function(msgs) {
    var messages = {};
    messages['civi-botdylan-jira'] = msgs;
    console.log('[GithubJiraHook] Update comments', messages);
    return commentManager.update(issueNumber, messages);
  })
  .catch(function(err){
    bot.handleError(err);
  });

  return bot.isSimulated ? p : null;
};
