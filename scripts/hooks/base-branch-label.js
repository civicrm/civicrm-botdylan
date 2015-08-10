var _ = require('lodash'),
  Promise = require('promise');

/**
 * Check the base-branch used for a pull-request. Apply an eponymous label (if it
 * is available).
 */
module.exports = function baseBranchLabelHook(bot, repo_info, payload) {
  if (payload.action !== 'opened' && payload.action !== 'reopened' &&  payload.action !== 'synchronize') {
    return;
  }

  var appliedLabelNames = null, newLabels = null;
  return invokeApi(bot.github.issues.getIssueLabels, {number: payload.pull_request.number})
    .then(function(appliedLabels){
      appliedLabelNames = _.pluck(appliedLabels, 'name');
      if (_.contains(appliedLabelNames, payload.pull_request.base.ref)) {
        console.log('[BaseBranchLabelHook] Labels look good:', payload.pull_request.number, appliedLabelNames);
      } else {
        newLabels = _.union([payload.pull_request.base.ref], appliedLabelNames);
        return invokeApi(bot.github.issues.edit, {
           number: payload.pull_request.number,
           labels: newLabels
        })
        .then(function(){
          console.log('[BaseBranchLabelHook] Updated labels:', payload.pull_request.number, newLabels);
        });
      }
    });

  /**
   * Wrapper for 'github' API. Automatically set owner+repo details,
   * and return call as a promise.
   *
   * ex: invokeApi(github.issues.getComments, {number: 123})
   *   .then(function(comments)...);
   *
   * @return Promise
   */
  function invokeApi(action, msg) {
    var func = Promise.denodeify(action);
    var args = _.extend({}, {
      user: repo_info.owner,
      repo: repo_info.name
    }, msg);
    return func(args);
  }

};