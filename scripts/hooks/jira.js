var JiraChecker = require('../../lib/jira-checker.js');
var CommentManager = require('../../lib/comment-manager.js');
var _ = require('lodash');

module.exports = function githubJiraHook(bot, repo_info, payload) {
  bot.trace('* [GithubJiraHook] Logged hook at ' + repo_info.owner + '/' + repo_info.name);
  console.log(repo_info);
  console.log(payload);

  if (payload.action !== 'opened' && payload.action !== 'reopened' &&  payload.action !== 'synchronize') {
    return;
  }

  var jiraChecker = new JiraChecker(bot.options.jira, payload.pull_request);
  var commentManager = CommentManager(bot.github, bot.options.username, repo_info);

  console.log('[GithubJiraHook] Check for JIRA references');
  var p = jiraChecker.check().then(function(msgs) {
    var messages = {};
    messages['civi-botdylan-jira'] = msgs;
    console.log('[GithubJiraHook] Update comments', messages);
    return commentManager.update(parseInt(payload.number), messages);
  })
  .catch(function(err){
    bot.handleError(err);
  });

  return bot.isSimulated ? p : null;
};
