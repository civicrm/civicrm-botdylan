var _ = require('lodash'),
    Promise = require('promise');

/**
 * @param Github github, authenticated github connection
 * @param string username, the user posting the comment
 * @param Object repo_info, with 'owner', 'name', 'full_name'
 */
module.exports = function CommentManager(github, username, repo_info) {

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
   * @param Object parts
   * @return Promise<void>
   */
  function update(prId, parts) {
    return invokeApi(github.issues.getComments, {number: prId})
      .then(function(comments){
        return Promise.all(_.map(parts, function(msgText, msgId){
          return updateSingle(prId, msgId, msgText, findBotComment(comments, msgId));
        }));
      })
      .then(function() {
        // For consumers, mask variations in returns.
        return null;
      }).done();
  }

  function updateSingle(prId, msgId, newMsg, oldComment) {
    if (!_.isEmpty(newMsg)) newMsg = newMsg.trimRight() + footer(msgId);
    console.log('[CommentManager] New message:', msgId, newMsg);

    var removedMsg = '*(Automated message removed.)*' + footer(msgId);

    console.log('[CommentManager] Found:', msgId, oldComment ? oldComment.id : null);
    if (oldComment && newMsg && oldComment.body !== newMsg) {
      console.log('[CommentManager] Update');
      return invokeApi(github.issues.editComment, {
        id: oldComment.id,
        body: newMsg
      });
    }
    else if (oldComment && !newMsg && oldComment.body !== removedMsg) {
      console.log('[CommentManager] Remove:', msgId);
      return invokeApi(github.issues.editComment, {
        id: oldComment.id,
        body: removedMsg
      });
    }
    else if (!oldComment && newMsg) {
      console.log('[CommentManager] Create:', msgId);
      return invokeApi(github.issues.createComment, {
        number: prId,
        body: newMsg
      });
    }
    else {
      console.log('[CommentManager] No changes:', msgId);
      return new Promise(function(r){r(null);});
    }
  }

  function footer(msgId) {
    return '\n\n<span ' + msgId + '></span>';
  }

  function findBotComment(comments, msgId) {
    return _.find(comments, function(comment){
      return (comment.body.indexOf('<span ' + msgId) >= 0) &&
        comment.user.login === username;
    });
  }

  return {
    update: update
  };
};
