/**
 * Execute a command, and apply logging.
 * @return Promise
 */
module.exports = function(dir, cmd) {
    process.chdir(dir);
    console.log('[Exec] CMD: ' + cmd);
    return require('child-process-promise').exec(cmd).then(function(r){
      console.log('[Exec] CODE: ', r.childProcess.exitCode);
      console.log('[Exec] STDOUT:', r.stdout);
      console.log('[Exec] STDERR:', r.stderr);
      return r;
    });
};

module.exports.escape = function(value) {
  return '"'+value.replace(/(["\s'$`\\])/g,'\\$1')+'"';
};
