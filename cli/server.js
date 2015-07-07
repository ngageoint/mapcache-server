var api = require('../api');

exports.status = function(yargs) {
  var argv =
    yargs.usage('Prints the current status of the server.')
    .option('x', {
      alias: 'xxx',
      description: 'yar, it usually be a bad idea'
    })
    .help('help')
    .argv;

  new api.Server().getInfo(function(err, server) {
    if (err) return console.error('Error getting server status: ', err);
    console.log('\nServer status: \n\tTotal Server Bytes Available: %s\n\tTotal Server Bytes Used: %s\n\tmapcache Bytes Available: %s\n\tmapcache Bytes Used: %s\n\tMaximum Cache Size: %s', server.serverTotal, server.serverFree, server.total, server.used, server.maximumCacheSize);
    process.exit();
  });
}
