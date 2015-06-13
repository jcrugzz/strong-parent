var fs = require('fs');
var path = require('path');
var through = require('through2');
var jsonStream = require('json-stream');
var test = require('tape');
var ls = require('list-stream');
var Parent = require('..');

var child = path.join(__dirname, 'fixtures', 'child.js');
var fixture = fs.createReadStream(path.join(__dirname, 'fixtures', 'output.txt'));

test('stream all the things', function (t) {
  var childCount;

  fixture
    .on('error', t.error.bind(t))
    .pipe(new Parent(child))
    .on('log', function (log) {
      childCount = log.count;
    })
    .on('error', t.error.bind(t))
    .pipe(jsonStream())
    .pipe(ls.obj(function (err, ary) {

      t.equals(ary.length, childCount, 'child objects should equal parent objects');
      t.end();
    }));
});
