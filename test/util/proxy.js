let lib = process.env.POMELO_RPC_COV ? 'lib-cov' : 'lib';
let should = require('should');
let Proxy = require('../../' + lib + '/util/proxy');

let A = function(value) {
  this.value = value;
};
A.prototype.add = function(num) {
  this.value += num;
};
A.prototype.sub = function(num) {
  this.value -= num;
};
A.prototype.addB = function() {
  this.b.value++;
};
A.prototype.addInternal = function() {
  this.add(1);
};

let B = function(value){
  this.value = value;
};
B.prototype.addA = function() {
  this.a.value++;
};

let callback = function(service, method, args, attach, invoke) {

};

describe('proxy', function() {
  describe('#create', function() {
    it('should invoke the proxy function if it had been set', function() {
      let callbackCount = 0;
      let cb = function(service, method, args, attach, invoke) {
        callbackCount++;
      };
      let a = new A(1);

      let proxy = Proxy.create({
        service: 'A',
        origin: a,
        proxyCB: cb
      });
      proxy.add(1);
      callbackCount.should.equal(1);
    });

    it('should invoke the origin function if the proxy function not set', function() {
      let value = 1;
      let a = new A(value);

      let proxy = Proxy.create({
        origin: a
      });
      proxy.add(1);
      a.value.should.equal(value + 1);
    });

    it('should invoke the origin function if the invoke callback had been called in proxy function', function() {
      let callbackCount = 0;
      let originCallCount = 0;
      let value = 1;

      let cb = function(namespace, method, args, attach, invoke) {
        callbackCount++;
        invoke(args);
      };
      let a = new A(value);
      a.add = function(num) {
        originCallCount++;
        this.value += num;
      };

      //overwrite the origin function
      let proxy = Proxy.create({
        origin: a,
        proxyCB: cb
      });
      proxy.add(1);

      callbackCount.should.equal(1);
      originCallCount.should.equal(1);
      a.value.should.equal(value + 1);
    });

    it('should not invoke the origin function if the invoke callback not called', function() {
      let callbackCount = 0;
      let originCallCount = 0;
      let value = 1;

      let cb = function(namespace, method, args, attach, invoke) {
        callbackCount++;
      };
      let a = new A(value);
      //overwrite the origin function
      a.add = function(num) {
        originCallCount++;
        this.value += this.value;
      };

      let proxy = Proxy.create({
        origin: a,
        proxyCB: cb
      });
      proxy.add(1);

      callbackCount.should.equal(1);
      originCallCount.should.equal(0);
      a.value.should.equal(value);
    });

    it('should flush the operation result on fields to the origin object', function() {
      let value = 1;

      let a = new A(value);
      let proxy = Proxy.create({
        origin: a
      });

      proxy.value++;

      proxy.value.should.equal(value+ 1);
      a.value.should.equal(value + 1);
    });

    it('should be ok if create proxies for two objects that references each other', function() {
      let callbackCount = 0;
      let valueA = 1;
      let valueB = 2;

      let cb = function(namespace, method, args, attach, invoke) {
        callbackCount++;
        invoke(args);
      };
      let a = new A(valueA);
      let b = new B(valueB);

      let proxyA = Proxy.create({
        origin: a,
        proxyCB: cb
      });
      let proxyB = Proxy.create({
        origin: b,
        proxyCB: cb
      });
      a.b = b;
      b.a = a;
      proxyA.addB();
      proxyB.addA();

      callbackCount.should.equal(2);
      a.value.should.equal(valueA + 1);
      b.value.should.equal(valueB + 1);
    });

    it('should not proxy the internal invoking', function() {
      let callbackCount = 0;
      let value = 1;

      let cb = function(namespace, method, args, attach, invoke) {
        callbackCount++;
        invoke(args);
      };
      let a = new A(value);

      let proxy = Proxy.create({
        origin: a,
        proxyCB: cb
      });
      proxy.addInternal(1);

      callbackCount.should.equal(1);
      a.value.should.equal(value + 1);
    });

    it('should has the same class info with origin object', function() {
      let a = new A(1);

      let proxy = Proxy.create({
        origin: a
      });

      proxy.should.be.an.instanceof(A);
    });

    it('should pass the attach from opts to invoke callback', function() {
      let callbackCount = 0;
      let expectAttach = {someValue: 1, someObject: {}, someStr: "hello"};

      let cb = function(namespace, method, args, attach, invoke) {
        callbackCount++;
        should.exist(attach);
        attach.should.equal(expectAttach);
      };
      let a = new A(1);

      let proxy = Proxy.create({
        origin: a,
        proxyCB: cb,
        attach: expectAttach
      });
      proxy.addInternal(1);

      callbackCount.should.equal(1);
    });
  });
});