/*global suite:false test:false */
'use strict';

var chai = require('chai-stack');
var lengthStream = require('..'); // require('length-stream');
var passStream = require('pass-stream');

var t = chai.assert;

suite('basic');

test('basic use, results with length being provided to listener before end', function (done) {
  var resultantLength;
  function lengthListener(length) {
    resultantLength = length;
  }
  var ls = lengthStream(lengthListener);
  var stream = passStream();
  var accumData = [];
  stream
    .pipe(ls)
    .on('error', function (err) { done(err); })
    .on('data', function (data) { accumData.push(data); })
    .on('end', function () {
      t.deepEqual(Buffer.concat(accumData).toString(), 'abcdefghi');
      t.equal(resultantLength, 9);
      done();
    });
  process.nextTick(function () {
    stream.write('abc');
    stream.write('def');
    stream.end('ghi');
  });
});


test('lengthListener not provided to factory, throws error', function () {
  function throwsErr() {
    var stream = lengthStream();
  }
  t.throws(throwsErr, /requires a lengthListener fn/);
});
