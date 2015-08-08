var exec = function(dir, cmd) {
    process.chdir(dir);
    console.log('[Exec] CMD: ' + cmd);
    return require('child-process-promise').exec(cmd).then(function(r){
      console.log('[Exec] CODE: ', r.childProcess.exitCode);
      console.log('[Exec] STDOUT:', r.stdout);
      console.log('[Exec] STDERR:', r.stderr);
      return r;
    });
};

function checkoutPullRequest(repoDir, prId) {
  return exec(repoDir, 'git clean -f && git checkout --detach')
    .then(function(r){
      return exec(repoDir, 'git branch | grep -v \\* | grep \'^ *pr-\' | xargs');
    })
    .then(function(r){
      if (r.stdout.trim() !== '') {
        return exec(repoDir, 'git branch -D ' + r.stdout.trim());
      }
    })
    .then(function(r){
      return exec(repoDir, 'git fetch origin pull/' + prId + '/head:pr-' + prId + ' && git checkout pr-' + prId);
    });
}

module.exports = {
  checkoutPullRequest: checkoutPullRequest
};
