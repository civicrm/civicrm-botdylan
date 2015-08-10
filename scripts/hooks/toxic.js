var GitHelper = require('../../lib/git-helper.js');
var ToxicChecker = require('../../lib/toxic-checker.js');
var CommentManager = require('../../lib/comment-manager.js');
var _ = require('lodash');

/**
 * Check .toxic.json for a list of PHP functions considered toxic. If any are
 * modified in the PR, then post a warning to the PR.
 */
module.exports = function toxicPhpHook(bot, repo_info, payload) {
  console.log('* [ToxicPhpHook] Logged hook at ' + repo_info.owner + '/' + repo_info.name);

  var GitPool = require('../../lib/git-pool.js').init({
    baseDir: bot.options['git-pool']
  });
  var gitUrl = 'git://github.com/' + repo_info.owner + '/' + repo_info.name + '.git'

  if (payload.action !== 'opened' && payload.action !== 'reopened' &&  payload.action !== 'synchronize') {
    return;
  }

  var repo = null; // ex: {url: ..., dir: ...., id: ...}
  var toxicChecker = null;
  var commentManager = CommentManager(bot.github, bot.options.username, repo_info);

  var p = GitPool.acquire(gitUrl)
    .then(function(theRepo){
      repo = theRepo;
      console.log('[ToxicPhpHook] Cleanup repo:', repo);
      return GitHelper.cleanup(repo.dir);
    })
    .then(function(){
      console.log('[ToxicPhpHook] Checkout PR');
      return GitHelper.checkoutPullRequest(repo.dir, parseInt(payload.number));
    })
    .then(function(prBranchName){
      console.log('[ToxicPhpHook] Check for toxic function changes');
      toxicChecker = new ToxicChecker(repo.dir, payload.pull_request.base.sha, payload.pull_request.head.sha);
      return toxicChecker.check();
    })
    .then(function(messages){
      console.log('[ToxicPhpHook] Update comments', messages);
      return commentManager.update(parseInt(payload.number), messages);
    })
    .finally(function(){
      console.log('[ToxicPhpHook] Release repo:', repo);
      GitPool.release(repo);
    })
    .catch(function(err){
      bot.handleError(err);
    });

  return bot.isSimulated ? p : null;
};
