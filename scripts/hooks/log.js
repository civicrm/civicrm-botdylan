var _ = require('lodash');

/**
 * Print hook data to the console
 */
module.exports = function logHook(bot, repo_info, payload) {
  bot.trace('[Log] Repo:', repo_info);
  bot.trace('[Log] Payload:', payload);
};
