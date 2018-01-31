let net = require('net');
let EventEmitter = require('events').EventEmitter;
let util = require('util');
let utils = require('../../../lib/util/utils');
let Composer = require('stream-pkg');

let Client = function() {
  EventEmitter.call(this);
  this.requests = {};
  this.curId = 0;
  this.composer = new Composer();
  this.socket = null;
};
util.inherits(Client, EventEmitter);

let pro = Client.prototype;

pro.connect = function(host, port, cb) {
  this.socket = net.connect({port: port, host: host}, function() {
    utils.invokeCallback(cb);
  });
  console.log('socket: %j', !!this.socket);
  let self = this;
  this.socket.on('data', function(data) {
    self.composer.feed(data);
  });

  this.composer.on('data', function(data) {
    let pkg = JSON.parse(data.toString());
    let cb = self.requests[pkg.id];
    delete self.requests[pkg.id];

    if(!cb) {
      return;
    }

    cb.apply(null, pkg.resp);
  });
};

pro.send = function(msg, cb) {
  let id = this.curId++;
  this.requests[id] = cb;
  this.socket.write(this.composer.compose(JSON.stringify({id: id, msg: msg})));
};

pro.close = function() {
  this.socket.end();
};

module.exports.create = function(opts) {
  return new Client();
};