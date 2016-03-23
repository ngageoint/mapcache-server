var spawn       = require('cross-spawn-async');
var createError = require('err-code');
var Q           = require('q');

function execute(command, args, options) {
    var process;
    var stderr = new Buffer('');
    var stdout = new Buffer('');
    var deferred = Q.defer();

    // Buffer output, reporting progress
    process = spawn(command, args, options);
    if (process.stdout) {
        process.stdout.on('data', function (data) {
            stdout = Buffer.concat([stdout, data]);
            data.type = 'stdout';
            deferred.notify(data);
        });
    }
    if (process.stderr) {
        process.stderr.on('data', function (data) {
            stderr = Buffer.concat([stderr, data]);
            data.type = 'stderr';
            deferred.notify(data);
        });
    }

    // If there is an error spawning the command, reject the promise
    process.on('error', function (error) {
        return deferred.reject(error);
    });

    // Listen to the close event instead of exit
    // They are similar but close ensures that streams are flushed
    process.on('close', function (code) {
        var fullCommand;
        var error;

        stdout = stdout.toString();
        stderr = stderr.toString();

        if (!code) {
            return deferred.resolve([stdout, stderr]);
        }

        // Generate the full command to be presented in the error message
        args = args || [];
        fullCommand = command;
        fullCommand += args.length ? ' ' + args.join(' ') : '';

        // Build the error instance
        error = createError('Failed to execute "' + fullCommand + '", exit code of #' + code, 'ECMDERR', {
            stderr: stderr,
            stdout: stdout,
            details: stderr,
            status: code
        });

        return deferred.reject(error);
    });

    deferred.promise.cp = process;

    return deferred.promise;
}

function buffered(command, args, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = null;
    }
    if (typeof args === 'function') {
        callback = args;
        args = options = null;
    }
    if (args && !Array.isArray(args)) {
        options = args;
        args = null;
    }

    var promise = execute(command, args, options);

    // Manual nodeify because of .spread :(
    if (!callback) {
        return promise;
    }

    promise
    .spread(function (stdout, stderr) {
        callback(null, stdout, stderr);
    }, function (err) {
        callback(err, err.stdout, err.stderr);
    })
    .done();

    return promise.cp;
}

module.exports = buffered;
