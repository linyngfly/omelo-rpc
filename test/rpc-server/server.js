let Server = require('../../').server;
let should = require('should');

let WAIT_TIME = 100;

let paths = [
  {namespace: 'user', path: __dirname + '../../mock-remote/area'},
  {namespace: 'sys', path: __dirname + '../../mock-remote/connector'}
];

let port = 3333;

describe('server', function() {

  describe('#create', function() {
    it('should create gateway by providing port and paths parameters', function(done) {
      let opts = {
        paths: paths,
        port: port
      };

      let errorCount = 0;
      let closeCount = 0;
      let gateway = Server.create(opts);

      should.exist(gateway);
      gateway.on('error', function(err) {
        errorCount++;
      });
      gateway.on('closed', function() {
        closeCount++;
      });

      gateway.start();
      gateway.stop();

      setTimeout(function() {
        errorCount.should.equal(0);
        closeCount.should.equal(1);
        done();
      }, WAIT_TIME);
    });

    it('should change the default acceptor by pass the acceptorFactory to the create function', function(done) {
      let oport = 3333;
      let constructCount = 0, listenCount = 0, closeCount = 0;

      let MockAcceptor = function(opts, cb) {
        constructCount++;
      };

      MockAcceptor.prototype.listen = function(port) {
        oport.should.equal(port);
        listenCount++;
      };

      MockAcceptor.prototype.close = function() {
        closeCount++;
      };

      MockAcceptor.prototype.on = function() {};

      MockAcceptor.prototype.emit = function() {};

      let acceptorFactory = {
        create: function(opts, cb) {
          return new MockAcceptor(null, cb);
        }
      };

      let opts = {
        paths: paths,
        port: oport,
        acceptorFactory: acceptorFactory
      };

      let gateway = Server.create(opts);

      should.exist(gateway);

      gateway.start();
      gateway.stop();

      setTimeout(function() {
        constructCount.should.equal(1);
        listenCount.should.equal(1);
        closeCount.should.equal(1);
        done();
      }, WAIT_TIME);
    });
  });

});