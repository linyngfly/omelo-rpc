let sioClient = require('socket.io-client');
let EventEmitter = require('events').EventEmitter;
let util = require('util');
let utils = require('../../../lib/util/utils');

let Client = function() {
  EventEmitter.call(this);
  this.requests = {};
  this.curId = 0;
};
util.inherits(Client, EventEmitter);

let pro = Client.prototype;

pro.connect = function(host, port, cb) {
  this.socket = sioClient.connect(host + ':' + port, {'force new connection': true});

  let self = this;
  this.socket.on('message', function(pkg) {
    let cb = self.requests[pkg.id];
    delete self.requests[pkg.id];

    if(!cb) {
      return;
    }

    cb.apply(null, pkg.resp);
  });

  this.socket.on('connect', function() {
    utils.invokeCallback(cb);
  });
};

pro.send = function(msg, cb) {
  let id = this.curId++;
  this.requests[id] = cb;
  this.socket.emit('message', {id: id, msg: msg});
};

pro.close = function() {
  this.socket.disconnect();
};

module.exports.create = function(opts) {
  return new Client();
};