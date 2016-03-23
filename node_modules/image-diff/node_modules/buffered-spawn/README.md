# buffered-spawn [![Build Status](https://travis-ci.org/bower/buffered-spawn.svg?branch=master)](https://travis-ci.org/bower/buffered-spawn)

Buffered child_process#spawn.


## Installation

`$ npm install buffered-spawn`


## Why

- Easy to use
- Uses [cross-spawn](http://github.com/IndigoUnited/node-cross-spawn) that fixes windows [issues](https://github.com/joyent/node/issues/2318)
- Supports callback & promise style


## Usage

In terms of arguments, they are equal to node's [spawn](http://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options).

```js
var buffspawn = require('buffered-spawn');

// Callback style
buffspawn('git', ['clone', 'git@github.com/bower/bower'], { cwd: '~/foo' }, function (err, stdout, stderr) {
    // Both stdout and stderr are set with the buffered output, even on failure
    if (err) {
        return console.err('Command failed with error code of #'  + err.status);
    }

    console.log(stdout);
    console.log(stderr);
});

// Promise style
buffspawn('git', ['clone', 'git@github.com/bower/bower'], { cwd: '~/foo' })
.spread(function (stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
}, function (err) {
    // Besides err.status there's also err.stdout & err.stderr
    console.err('Command failed with error code of #'  + err.status);
});
```

When using promises you can also get feedback via progress:

```js
buffspawn('git', ['clone', 'git@github.com/bower/bower'])
.progress(function (buff) {
    console.log(buff.toString());
})
.spread(function (stdout, stderr) {
    console.log('---------------------------');
    console.log(stdout);
    console.log(stderr);
}, function (err) {
    console.err('Command failed with error code of #'  + err.status);
});
```

The actual child process is available if necessary:

```js
var buffspawn('buffered-spawn');

// Callback style
var cp = buffspawn('git', ['clone', 'git@github.com/bower/bower'], function () {}};

// Promise style
var promise = buffspawn('git', ['clone', 'git@github.com/bower/bower']);
var cp = promise.cp;
```


## Tests

`$ npm test`


## License

Released under the [MIT License](http://www.opensource.org/licenses/mit-license.php).
