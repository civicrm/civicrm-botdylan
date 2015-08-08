module.exports = function advice(bot, repo_info, payload) {
  bot.trace('* [Advice] Logged hook at ' + repo_info.owner + '/' + repo_info.name);
  console.log(repo_info);
  console.log(payload);

  var GitPool = require('../../git-pool.js').init({
    baseDir: bot.options['git-pool']
  });
  var GitHelper = require('../../git-helper.js');
  var gitUrl = 'git://github.com/' + repo_info.owner + '/' + repo_info.name + '.git'
  var NodeGit = require('nodegit');

  if (payload.action !== 'opened' && payload.action !== 'reopened' &&  payload.action !== 'synchronize') {
    return;
  }

  var repo = null, remote = null;
  var p = GitPool.acquire(gitUrl)
    .then(function(theRepo){
      repo = theRepo;
      console.log('acquired repo', repo);
      return GitHelper.checkoutPullRequest(repo.dir, parseInt(payload.number));
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
