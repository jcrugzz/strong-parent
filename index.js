
var fs = require('fs');
var path = require('path');
var os = require('os');
var uuid = require('uuid');
var Fork = require('fork');
var duplexify = require('duplexify');
var after = require('after');
var extend = require('util')._extend;

//
// This will accept the following
// 1. A payload to merge in with the filename created
// 2. A path to the child process to fork that will do the processing
//

module.exports = StrongParent;

function StrongParent(options) {
  if (!(this instanceof StrongParent)) return new StrongParent(options);

  //
  // We just have a pth in this case, a child proc path
  //
  if (typeof options === 'string') {
    this.childPath = options;
    options = {};
  }

  this.filePath = options.filePath || path.join(os.tmpdir(), uuid.v4());
  this.childPath = this.childPath || options.path;
  this.childArgs = options.args;
  this.childEnv = options.env;
  this.payload = options.payload || {};

  this.stream = duplexify();

  //
  // Setup forking of child to do the processing
  //
  this.fork = new Fork({
    path: this.childPath,
    args: this.childArgs,
    env: this.childEnv
  }).fork(extend({ __file: this.filePath }, this.payload))
    .on('response', this._onRes.bind(this))
    .on('log', this.stream.emit.bind(this.stream, 'log'))
    .on('error', this.stream.emit.bind(this.stream, 'error'));

  this.stream.setWritable(fs.createWriteStream(this.filePath));


  return this.stream;
}

StrongParent.prototype._onRes = function (message) {

  this.returnPath = message.__file;

  if (!this.returnPath) {
    return this.stream.emit('error', new Error('No Filepath found, child must return __file parameter'));
  }

  if (Object.keys(message).length > 1) {
    delete message.__file;
    this.stream.emit('response', message);
  }

  this.readable = fs.createReadStream(this.returnPath)
    //
    // Try to cleanup the file
    //
    .on('end', this._onEnd.bind(this));

  this.stream.setReadable(this.readable);
};

//
// When the readable side ends clean up for ourselves
//
StrongParent.prototype._onEnd = function () {
  var next = after(2, nullOut);
  var self = this;

  remove(this.filePath, next);
  remove(this.returnPath, next);

  function nullOut() {
    self.readable = null;
  }

};

function remove(path, callback) {
  //
  // We may want to retry here on Error
  //
  fs.unlink(path, function (err) {
    if (err && err.code !== 'ENOENT') {
      return callback(err);
    }
    callback();
  });
}
