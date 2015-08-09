/**
 * ToxicChecker looks for a .toxic.json file
 * determines if any matching changes have
 * been made.
 */

var Promise = require('promise');

/**
 * @param string repoDir, local file system path
 * @param string fromRef, branch/tag/commit name
 * @param string toRef, branch/tag/commit name
 */
module.exports = function ToxicChecker(repoDir, fromRef, toRef) {

  /**
   * @return Promise<array> List of messages
   */
  function check() {
    console.log('[ToxicChecker]', repoDir, fromRef, toRef);
    return new Promise(function(resolve,reject) {
      resolve();
    });
  }

  return {
    check: check
  };
};
