var GitHelper = require('../../git-helper.js');
var ToxicChecker = require('../../toxic-checker.js');
var CommentManager = require('../../comment-manager.js');
var _ = require('lodash');

module.exports = function advice(bot, repo_info, payload) {
  bot.trace('* [Advice] Logged hook at ' + repo_info.owner + '/' + repo_info.name);
  console.log(repo_info);
  console.log(payload);

  var GitPool = require('../../git-pool.js').init({
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
      console.log('[Advice] Cleanup repo:', repo);
      return GitHelper.cleanup(repo.dir);
    })
    .then(function(){
      console.log('[Advice] Checkout PR');
      return GitHelper.checkoutPullRequest(repo.dir, parseInt(payload.number));
    })
    .then(function(prBranchName){
      console.log('[Advice] Check for toxic function changes');
      toxicChecker = new ToxicChecker(repo.dir, payload.pull_request.base.sha, payload.pull_request.head.sha);
      return toxicChecker.check();
    })
    .then(function(messages){
      return commentManager.update(parseInt(payload.number), []);//messages);
    })
    .finally(function(){
      console.log('[Advice] Release repo:', repo);
      GitPool.release(repo);
    })
    .catch(function(err){
      bot.handleError(err);
    });

  return bot.isSimulated ? p : null;
};
