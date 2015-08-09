var _ = require('lodash');

module.exports = function logHook(bot, repo_info, payload) {
  console.log('[Log] Repo:', repo_info);
  console.log('[Log] Payload:', payload);
};
