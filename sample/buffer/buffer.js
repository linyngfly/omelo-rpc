let m = new Buffer('hello');
console.log('old length %d', m.length);
let p = JSON.stringify(m);
let q = JSON.parse(p);
console.log(p);
console.log('stringify length %d', new Buffer(p).length);
console.log(q);
let buf = new Buffer(q.data);
console.log(buf.toString())