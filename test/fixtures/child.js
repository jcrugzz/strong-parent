var child = require('strong-child');
var through = require('through2');
var jsonStream = require('json-stream');
var stringify = require('stringify-stream');

var duplex = child();

var count = 0;

duplex
  .pipe(jsonStream())
  .on('error', function (err) {
    console.error(err);
  })
  .pipe(through.obj(function (data, enc, cb) {
    ++count;
    cb(null, data);
  }))
  .on('finish', function () {
    console.log('objects in child %d', count);
    duplex.log({ count: count });
  })
  .pipe(stringify())
  .pipe(duplex);
