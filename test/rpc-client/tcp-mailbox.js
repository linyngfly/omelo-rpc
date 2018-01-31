let lib = process.env.POMELO_RPC_COV ? 'lib-cov' : 'lib';
let should = require('should');
let Mailbox = require('../../' + lib + '/rpc-client/mailboxes/tcp-mailbox');
let Server = require('../../').server;
let Tracer = require('../../lib/util/tracer');

let WAIT_TIME = 100;

let paths = [
  {namespace: 'user', serverType: 'area', path: __dirname + '../../mock-remote/area'},
  {namespace: 'sys', serverType: 'connector', path: __dirname + '../../mock-remote/connector'}
];

let port = 3333;

let server = {
  id: 'area-server-1',
  host: '127.0.0.1',
  port: port
};

let msg = {
  namespace: 'user',
  serverType: 'area',
  service: 'addOneRemote',
  method: 'doService',
  args: [1]
};

let tracer = new Tracer(console, false);

describe('tcp mailbox test', function() {
  let gateway;

  before(function(done) {
    //start remote server
    let opts = {
      acceptorFactory: Server.TcpAcceptor,
      paths: paths,
      port: port,
      bufferMsg: true,
      interval: 30
    };

    gateway = Server.create(opts);
    gateway.start();
    done();
  });

  after(function(done) {
    //stop remote server
    gateway.stop();
    done();
  });

  describe('#create', function() {
    it('should be ok for creating a mailbox and connect to the right remote server', function(done) {
      let mailbox = Mailbox.create(server);
      should.exist(mailbox);
      mailbox.connect(tracer, function(err) {
        should.not.exist(err);
        mailbox.close();
        done();
      });
    });

    it('should return an error if connect fail', function(done) {
      let server = {
        id: "area-server-1",
        host: "127.0.0.1",
        port: -1000  //invalid port
      };

      let mailbox = Mailbox.create(server);
      should.exist(mailbox);
      mailbox.connect(tracer, function(err) {
        should.exist(err);
        done();
      });
    });
  });

  describe('#send', function() {
    it('should send request to remote server and get the response from callback function', function(done) {
      let mailbox = Mailbox.create(server);
      mailbox.connect(tracer, function(err) {
        should.not.exist(err);

        mailbox.send(tracer, msg, null, function(tracer, err, res) {
          console.log(err, res);
          should.exist(res);
          res.should.equal(msg.args[0] + 1);
          mailbox.close();
          done();
        });
      });
    });

    it('should distinguish different services and keep the right request/response relationship', function(done) {
      let value = 1;
      let msg1 = {
        namespace: 'user',
        serverType: 'area',
        service: 'addOneRemote',
        method: 'doService',
        args: [value]
      };
      let msg2 = {
        namespace: 'user',
        serverType: 'area',
        service: 'addOneRemote',
        method: 'doAddTwo',
        args: [value]
      };
      let msg3 = {
        namespace: 'user',
        serverType: 'area',
        service: 'addThreeRemote',
        method: 'doService',
        args: [value]
      };
      let callbackCount = 0;

      let mailbox = Mailbox.create(server);
      mailbox.connect(tracer, function(err) {
        should.not.exist(err);

        mailbox.send(tracer, msg1, null, function(tracer, err, res) {
          should.exist(res);
          res.should.equal(value + 1);
          callbackCount++;
        });

        mailbox.send(tracer, msg2, null, function(tracer, err, res) {
          should.exist(res);
          res.should.equal(value + 2);
          callbackCount++;
        });

        mailbox.send(tracer, msg3, null, function(tracer, err, res) {
          should.exist(res);
          res.should.equal(value + 3);
          callbackCount++;
        });
      });

      setTimeout(function() {
        callbackCount.should.equal(3);
        if(!!mailbox) {
          mailbox.close();
        }
        done();
      }, WAIT_TIME);
    });

    it('should distinguish different services and keep the right request/response relationship when use message cache mode', function(done) {
      let value = 1;
      let msg1 = {
        namespace: 'user',
        serverType: 'area',
        service: 'addOneRemote',
        method: 'doService',
        args: [value]
      };
      let msg2 = {
        namespace: 'user',
        serverType: 'area',
        service: 'addOneRemote',
        method: 'doAddTwo',
        args: [value]
      };
      let msg3 = {
        namespace: 'user',
        serverType: 'area',
        service: 'addThreeRemote',
        method: 'doService',
        args: [value]
      };
      let callbackCount = 0;

      let mailbox = Mailbox.create(server, {bufferMsg: true});
      mailbox.connect(tracer, function(err) {
        should.not.exist(err);

        mailbox.send(tracer, msg1, null, function(tracer, err, res) {
          should.exist(res);
          res.should.equal(value + 1);
          callbackCount++;
        });

        mailbox.send(tracer, msg2, null, function(tracer, err, res) {
          should.exist(res);
          res.should.equal(value + 2);
          callbackCount++;
        });

        mailbox.send(tracer, msg3, null, function(tracer, err, res) {
          should.exist(res);
          res.should.equal(value + 3);
          callbackCount++;
        });
      });

      setTimeout(function() {
        callbackCount.should.equal(3);
        if(!!mailbox) {
          mailbox.close();
        }
        done();
      }, WAIT_TIME);
    });

    it('should distinguish different services and keep the right request/response relationship if the client uses message cache mode but server not', function(done) {
      //start a new remote server without message cache mode
      let opts = {
        paths: paths,
        port: 3051
      };

      let gateway = Server.create(opts);
      gateway.start();

      let value = 1;
      let msg1 = {
        namespace: 'user',
        serverType: 'area',
        service: 'addOneRemote',
        method: 'doService',
        args: [value]
      };
      let msg2 = {
        namespace: 'user',
        serverType: 'area',
        service: 'addOneRemote',
        method: 'doAddTwo',
        args: [value]
      };
      let msg3 = {
        namespace: 'user',
        serverType: 'area',
        service: 'addThreeRemote',
        method: 'doService',
        args: [value]
      };
      let callbackCount = 0;

      let mailbox = Mailbox.create(server, {bufferMsg: true});
      mailbox.connect(tracer, function(err) {
        should.not.exist(err);

        mailbox.send(tracer, msg1, null, function(tracer, err, res) {
          should.exist(res);
          res.should.equal(value + 1);
          callbackCount++;
        });

        mailbox.send(tracer, msg2, null, function(tracer, err, res) {
          should.exist(res);
          res.should.equal(value + 2);
          callbackCount++;
        });

        mailbox.send(tracer, msg3, null, function(tracer, err, res) {
          should.exist(res);
          res.should.equal(value + 3);
          callbackCount++;
        });
      });

      setTimeout(function() {
        callbackCount.should.equal(3);
        if(!!mailbox) {
          mailbox.close();
        }
        gateway.stop();
        done();
      }, WAIT_TIME);
    });
  });

  describe('#close', function() {
    it('should emit a close event when mailbox close', function(done) {
      let closeEventCount = 0;
      let mailbox = Mailbox.create(server);
      mailbox.connect(tracer, function(err) {
        should.not.exist(err);
        mailbox.on('close', function() {
          closeEventCount++;
        });
        mailbox.close();
      });

      setTimeout(function() {
        closeEventCount.should.equal(1);
        done();
      }, WAIT_TIME);
    });

    it('should return an error when try to send message by a closed mailbox', function(done) {
      let mailbox = Mailbox.create(server);
      mailbox.connect(tracer, function(err) {
        should.not.exist(err);
        mailbox.close();
        mailbox.send(tracer, msg, null, function(tracer, err, res) {
          should.exist(err);
          done();
        });
      });
    });
  });

});
