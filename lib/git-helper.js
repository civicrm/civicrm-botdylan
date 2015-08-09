/**
 * @file
 * GitHelper provides random wrappers/helpers
 * for git.
 */

var exec = require('./my-exec.js');

/**
 * Remove any local changes, detach head, drop old PR branches.
 */
function cleanup(repoDir) {
  return exec(repoDir, 'git clean -f && git checkout --detach')
    .then(function(r){
      return exec(repoDir, 'git branch | grep -v \\* | grep \'^ *pr-\' | xargs');
    })
    .then(function(r){
      if (r.stdout.trim() !== '') {
        return exec(repoDir, 'git branch -D ' + r.stdout.trim());
      }
    });
}

/**
 * @return Promise<string branchName>
 */
function checkoutPullRequest(repoDir, prId) {
  return exec(repoDir, 'git fetch origin pull/' + prId + '/head:pr-' + prId + ' && git checkout pr-' + prId)
    .then(function(r){
      return 'pr-' + prId;
    });
}

module.exports = {
  cleanup: cleanup,
  checkoutPullRequest: checkoutPullRequest
};
