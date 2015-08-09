var _ = require('lodash'),
    Promise = require('promise');

/**
 * @param Github github, authenticated github connection
 * @param string username, the user posting the comment
 * @param Object repo_info, with 'owner', 'name', 'full_name'
 */
module.exports = function CommentManager(github, username, repo_info) {

  var flagAttr = 'civicrm-botdylan';

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
  
  /**
   * Compose a comment based on "parts" and put it on the
   * given pull-request. Existing comments may be updated
   * or deleted (to match the desired "parts").
   *
   * @param int prId
   * @param Array parts
   * @return Promise<void>
   */
  function update(prId, parts) {
    var newMsg = _.isEmpty(parts) ? null : compose(parts);
    console.log('[CommentManager] New message:', newMsg);
    
    var removedMsg = header('*(Automated message removed.)*');
    
    return findBotComment(prId)
      .then(function(comment){
        console.log('[CommentManager] Found:', comment.id);
        if (comment && newMsg && comment.body !== newMsg) {
          console.log('[CommentManager] Update');
          return invokeApi(github.issues.editComment, {
            id: comment.id,
            body: newMsg
          });
        }
        else if (comment && !newMsg && comment.body !== removedMsg) {
          console.log('[CommentManager] Remove');
          return invokeApi(github.issues.editComment, {
            id: comment.id,
            body: removedMsg
          });
        }
        else if (!comment && newMsg) {
          console.log('[CommentManager] Create');
          return invokeApi(github.issues.createComment, {
            number: prId,
            body: newMsg
          });
        }
        else {
          console.log('[CommentManager] No message changes.');
        }
      })
      .then(function() {
        // For consumers, mask variations in returns.
        return null;
      });
  }
  
  function header(msg) {
    return '<span ' + flagAttr + '>'+msg+'</span>';
  }

  /**
   * @param Array parts
   * @return string, the full message
   */
  function compose(parts) {
    var m = header('*(Automated notice)*');
    _.forEach(parts, function(part) {
      m = m + "\n\n----\n\n" + part;
    });
    return m;
  }
  
  function findBotComment(prId) {
    return invokeApi(github.issues.getComments, {number: prId})
      .then(function(comments){
        return _.find(comments, function(comment){
          return (comment.body.indexOf('<span ' + flagAttr) >= 0) &&
            comment.user.login === username;
        });
      });
  }

  return {
    update: update
  };
};
