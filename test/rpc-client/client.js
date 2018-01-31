let should = require('should');
let Server = require('../../').server;
let Client = require('../../').client;

let WAIT_TIME = 100;

// proxy records
let records = [
  {namespace: 'user', serverType: 'area', path: __dirname + '../../mock-remote/area'},
  {namespace: 'sys', serverType: 'connector', path: __dirname + '../../mock-remote/connector'}
];

// server info list
let serverList = [
  {id: 'area-server-1', type: "area", host: '127.0.0.1',  port: 3333},
  {id: 'connector-server-1', type: "connector", host: '127.0.0.1',  port: 4444},
  {id: 'connector-server-2', type: "connector", host: '127.0.0.1',  port: 5555},
];

// rpc description message
let msg = {
  namespace: 'user',
  serverType: 'area',
  service: 'whoAmIRemote',
  method: 'doService',
  args: []
};

describe('client', function() {
  let gateways = [];

  before(function(done) {
    gateways = [];
    //start remote servers
    let item, opts, gateway;
    for(let i=0, l=serverList.length; i<l; i++) {
      item = serverList[i];
      opts = {
        paths: records,
        port: item.port,
        context: {id: item.id}
      };

      gateway = Server.create(opts);
      gateways.push(gateway);
      gateway.start();
    }
    done();
  });

  after(function(done) {
    //stop remote servers
    for(let i=0; i<gateways.length; i++) {
      gateways[i].stop();
    }
    done();
  });

  describe('#create', function() {
    it('should be ok for creating client with an empty opts', function(done) {
      let client = Client.create();

      should.exist(client);

      client.start(function(err) {
        should.not.exist(err);
        client.stop(true);
        done();
      });
    });

    it('should add proxy instances by addProxies method', function() {
      let client = Client.create();

      should.exist(client);

      client.addProxies(records);

      let proxies = client.proxies, item;
      for(let i=0, l=records.length; i<l; i++) {
        item = records[i];
        proxies.should.have.property(item.namespace);
        proxies[item.namespace].should.have.property(item.serverType);
      }
    });

    it('should replace the default router by pass a opts.route to the create function', function(done) {
      let routeCount = 0, server = serverList[1], serverId = server.id, callbackCount = 0;

      let router = {
        id: 'aaa',
        route: function(msg, routeParam, servers, cb) {
          routeCount++;
          cb(null, serverId);
        }
      };

      let opts = {
        router: router
      };

      let client = Client.create(opts);
      client.addProxies(records);
      client.addServer(serverList[1]);

      client.start(function(err) {
        should.not.exist(err);
        client.proxies.sys.connector.whoAmIRemote.doService(null, function(err, sid) {
          callbackCount++;
          serverId.should.equal(sid);
        });
      });

      setTimeout(function() {
        routeCount.should.equal(1);
        callbackCount.should.equal(1);
        client.stop();
        done();
      }, WAIT_TIME);
    });
  });

  describe('#status', function() {
    it('should return an error if start twice', function(done) {
      let client = Client.create();
      client.start(function(err) {
        should.not.exist(err);
        client.start(function(err) {
          should.exist(err);
          done();
        });
      });
    });

    it('should ignore the later operation if stop twice', function(done) {
      let client = Client.create();
      client.start(function(err) {
        should.not.exist(err);
        client.stop();
        client.stop();
        done();
      });
    });

    it('should return an error if try to do rpc invoke when the client not start', function(done) {
      let client = Client.create();
      let sid = serverList[0].id;

      client.rpcInvoke(sid, msg, function(err) {
        should.exist(err);
        done();
      });
    });

    it('should return an error if try to do rpc invoke after the client stop', function(done) {
      let client = Client.create();
      let sid = serverList[0].id;

      client.addServer(serverList[0]);

      client.start(function() {
        client.rpcInvoke(sid, msg, function(err) {
          should.not.exist(err);
          client.stop(true);
          setTimeout(function() {
            client.rpcInvoke(sid, msg, function(err) {
              should.exist(err);
              done();
            });
          }, WAIT_TIME);
        });
      });
    });

  });
});
