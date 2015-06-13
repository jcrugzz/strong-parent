# strong-parent

[![build
status](https://secure.travis-ci.org/jcrugzz/strong-parent.svg)](http://travis-ci.org/jcrugzz/strong-parent)

Have you ever wanted to pipe a byte-stream to a child process but got hung up
with IPC bugs? Well look no further! In combination with
[`strong-child`](https://github.com/jcrugzz/strong-child) we provide an
interface to do that! By exposing a duplex stream in the parent, you can pipe
any sort of byte-stream to the returned stream and listen for whats returned by
the child. Its perfect for cases where you want to stream a bunch of data to the
child, do some expensive computation and pipe back out the result! We leverage
the file-system and simple message passing with `child_process.fork` to
accomplish this.

## Install

```sh
npm i strong-parent
```

## Usage

```js
var Parent = require('strong-parent');
var jsonStream = require('json-stream');
var db = require('./db');
var RequestStream = require('./request-stream')

var child = require.resolve('my-child-module'):

//
// Setup a hypothetical stream pipeline where we do the following.
// 1. Read data from teh database
// 2. Stream data to child process
// 3. Perform some computation on the data
// 4. Return a stream of operations that get used to create requests to teh
// database
//
db.stream()
  .pipe(new Parent(child))
  .on('log', function (msg) {
    //
    // Just log the whole object if we get a message from the child
    //
    console.dir(msg);
  })
  .pipe(jsonStream({ async: true }))
  .pipe(new RequestStream({ db: db }))

```

## License
MIT
