module.exports = function advice(bot, repo_info, payload) {
  bot.trace('* [Advice] Logged hook at ' + repo_info.owner + '/' + repo_info.name);
  console.log(repo_info);
  console.log(payload);

  var GitPool = require('../../git-pool.js').init({
    baseDir: bot.options['git-pool']
  });
  var GitHelper = require('../../git-helper.js');
  var gitUrl = 'git://github.com/' + repo_info.owner + '/' + repo_info.name + '.git'
  var ToxicChecker = require('../../toxic-checker.js');

  if (payload.action !== 'opened' && payload.action !== 'reopened' &&  payload.action !== 'synchronize') {
    return;
  }

  var repo = null; // ex: {url: ..., dir: ...., id: ...}
  var toxicChecker = null;
  var p = GitPool.acquire(gitUrl)
    .then(function(theRepo){
      repo = theRepo;
      console.log('[Advice] Cleanup git repo', repo);
      return GitHelper.cleanup(repo.dir);
    })
    .then(function(){
      console.log('[Advice] Checkout PR');
      return GitHelper.checkoutPullRequest(repo.dir, parseInt(payload.number));
    })
    .then(function(prBranchName){
      console.log('[Advice] Check for toxic function changes');
      toxicChecker = new ToxicChecker(repo.dir, payload.pull_request.head.sha, payload.pull_request.base.sha);
      return toxicChecker.check();
    })
    .then(function(){
      console.log('[Advice] Release');
      GitPool.release(repo);
    })
    .catch(function(err){
      bot.handleError(err);
    });

  return bot.isSimulated ? p : null;
};
