let zmq = require('zmq');
let socket = zmq.socket('dealer');
socket.identity = 'test';
socket.connect('tcp://localhost:3331');

run();

socket.on('message', function() {
	run();
})

let num_requests = 20000;
let start = Date.now();
let times = 0;

function run() {
	if (times > num_requests) {
		return;
	}

	if (times == num_requests) {
		let now = Date.now();
		let cost = now - start;
		console.log('run %d num requests cost: %d ops/sec', num_requests, cost, (num_requests / (cost / 1000)).toFixed(2));
		times = 0;
		start = now;
		return run();
	}

	times++;

	let payload = "hello";
	socket.send(payload);
}