/**
 * Primitive lock manager.
 *
 * var lockManager = require('./lib/lock.js');
 * if (!lockManager.acquire('foobar', 2000)) { return; }
 * ...
 * lockManager.release('foobar');
 */
 
var locks = {};

/**
 * Acquire a lock. If it fails, return immediately.
 * @return bool - true on success
 */
function acquire(name, ttl) {
  var now = new Date();
  if (locks[name] && now.getTime() < locks[name]) {
    return false;
  }
  locks[name] = now.getTime() + ttl;
  return true;
}

function release(name) {
  delete locks[name];
}

// API
module.exports = {
 acquire: acquire,
 release: release
};