/**
 * gitpool - Manage a collection of local git repositories.
 *
 * Example:
 *   var GitPool = require('git-pool').init({
 *     baseDir: '/var/spool/git'
 *   });
 *   GitPool.acquire('https://github.com/example/foo')
 *     .then(function(repo){
 *        ...
 *        GitPool.release(repo);
 *      })
 *     .catch(function(err) {...});
 *
 * Note: 'nodegit' does not work in Ubuntu 12.04, so use node-git-exec.
 * @see https://github.com/alexjeffburke/node-git-exec
 */
var poolModule = require('generic-pool'),
  fs = require('fs'),
  rimraf = require('rimraf'),
  Promise = require('promise'),
  NodeGit = require('nodegit');

var dirs = {}; // Map<string dir, TRUE>
var pools = {}; // Map<string gitUrl, poolModule.Pool>
var api = {};
var options = {};

function composeGitDir(gitUrl, id) {
  return options.baseDir + '/' 
    + gitUrl.replace(/[^a-zA-Z0-9\.]/g, '-')
    + '---'
    + id;
}

function composeFlagPath(gitUrl, id) {
  return options.baseDir + '/.' 
    + gitUrl.replace(/[^a-zA-Z0-9\.]/g, '-')
    + '---'
    + id
    + '.loaded';
}

function createRepo(gitUrl, callback) {
  var id = 1, gitDir = composeGitDir(gitUrl, id);
  while (dirs[gitDir]) {
    id++;
    gitDir = composeGitDir(gitUrl, id);
  }
  dirs[gitDir] = true;
  
  if (fs.existsSync(gitDir) && fs.existsSync(composeFlagPath(gitUrl, id))) {
    return new Promise(function(resolve,reject){
      resolve({id: id, url: gitUrl, dir: gitDir});
    });
  }

  if (fs.existsSync(gitDir)) {
    console.log('GitPool: Purge incomplete git repo', gitDir);
    rimraf.sync(gitDir);
  }

  console.log('GitPool: Clone git repo', gitUrl, gitDir);
  return NodeGit.Clone.clone(gitUrl, gitDir, null)
    .then(function(repo){
      fs.writeFileSync(composeFlagPath(gitUrl, id));
      return {id: id, url: gitUrl, dir: gitDir}
    });
};

function getPool(gitUrl) {
  if (!pools[gitUrl]) {
    pools[gitUrl] = poolModule.Pool({
      name: 'git:' + gitUrl,
      create: function(callback) {
        createRepo(gitUrl).then(function(repo) {
          callback(null, repo);
        })
        .catch(function(err){
          callback(err);
        });
      },
      destroy: function(client) {
        delete dirs[client.id];
      },
      max: options.max || 3,
      min: options.min || 0,
      idleTimeoutMillis: options.idleTimeoutMillis || 90000,
      log: options.log || false
    });
  }
  return pools[gitUrl];
}

function walkPools(gitUrls, action, callback) {
  if (gitUrls.length === 0) {
    if (callback) callback();
    return;
  }
  var gitUrl = gitUrls.pop();
  pools[gitUrl][action](function() {
    walkPools(gitUrls, action, callback);
  });
}

/**
 * @return api
 */
api.init = function init(newOptions) {
  options = newOptions;
  if (!options || !options.baseDir) throw "Missing option: baseDir";
  return api;
};

/**
 * @return Promise<NodeGit.Repository>
 */
api.acquire = function acquire(gitUrl) {
  return Promise.denodeify(getPool(gitUrl).acquire)();
};

/**
 * @return void
 */
api.release = function release(repo) {
  return getPool(repo.url).release(repo);
};

/**
 * @return Promise<void>
 */
api.drainAll = function drainAll() {
  return new Promise(function(resolve, reject) {
    walkPools(Object.keys(pools), 'drain', function() {
      resolve();
    });
  });
};

/**
 * @return void
 */
api.destroyAllNow = function destroyAllNow() {
  for (gitUrl in pools) {
    if (pools[gitUrl].destroyAllNow) {
      pools[gitUrl].destroyAllNow();
    }
  }
};

module.exports = api;
