# length-stream

Simple pass-through stream (RW) which accumulates the length of the stream. (streams2)

[![Build Status](https://secure.travis-ci.org/jeffbski/length-stream.png?branch=master)](http://travis-ci.org/jeffbski/length-stream)

## Installation

```bash
npm install length-stream
```

## Usage

Provide a lengthListener function when you construct the stream, it will be called with the resultant length of the stream just prior to end being emitted.

 - `lengthStream([options], lengthListener)` - constructs a new stream instance, lengthListener will be called prior to the `end` event being emitted
 - `options` - optional stream options
 - `lengthListener` function signature is `fn(resultantLength)`

```javascript
var lengthStream = require('length-stream');
var resultLength;
function lengthListener(length) {
  resultLength = length;
}
var lstream = lengthStream(lengthListener); // create instance, lengthListener will get length
readstream
  .pipe(lstream) // length calculated as it passes through
  .pipe(...)
```

## Goals

 - Easy to use pass-through stream which calculates the length of the string or Buffer stream
 - Builds on pass-stream to have all the normal pass-through functionality for a spec compliant stream
 - works with node 0.10+ streams2 but is also compatible with 0.8

## Why

I find that when I am accumulating stream data, that I often need the resultant length, so rather than write the code over and over again to do that, this simple stream can be piped through and it will provide the resultant length when the stream ends by calling

## Get involved

If you have input or ideas or would like to get involved, you may:

 - contact me via twitter @jeffbski  - <http://twitter.com/jeffbski>
 - open an issue on github to begin a discussion - <https://github.com/jeffbski/length-stream/issues>
 - fork the repo and send a pull request (ideally with tests) - <https://github.com/jeffbski/length-stream>

## License

 - [MIT license](http://github.com/jeffbski/length-stream/raw/master/LICENSE)

