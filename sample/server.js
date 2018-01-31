let Server = require('..').server;

// remote service path info list
let paths = [
  {namespace: 'user', path: __dirname + '/remote/test'}
];

let port = 3333;

let server = Server.create({paths: paths, port: port});
server.start();
console.log('rpc server started.');

process.on('uncaughtException', function(err) {
	console.error(err);
});