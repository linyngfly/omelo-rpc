let WebSocket = require('ws');
let ws = new WebSocket('ws://localhost:3331');

ws.on('open', function open() {
	start = Date.now();
	run();
});

ws.on('message', function(data, flags) {
	// flags.binary will be set if a binary data is received.
	// flags.masked will be set if the data was masked.
	run();
});

let num_requests = 20000;
let start = null;
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
	ws.send(payload);
}