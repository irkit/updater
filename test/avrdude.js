var test  = require('tap').test
, Avrdude = require("../lib/avrdude")
;

test('new Avrdude', function (t) {
  t.plan(1);
  var avrdude = new Avrdude();
  t.ok(avrdude, 'avrdude instantiated');
  t.end();
});

var real = (process.env.NODE_AVRDUDE_REAL !== '1');
test('run avrdude', function (t) {
  t.plan(2);
  var avrdude = new Avrdude();
  var process = avrdude.run([]);
  process.stderr.setEncoding('utf8');
  var stderr = "";
  process.stderr.on("data", function (chunk) {
    stderr += chunk;
  });
  process.on("error", function (err) {
    t.fail(true);
    t.end();
  });
  process.on("exit", function (code, signal) {
    t.ok(code == 0, 'exit code is 0', { skip: real });
    t.match(stderr, /avrdude version/, "outputs avrdude version", { skip: real });
    t.end();
  });
});
