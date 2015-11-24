var winston = require('winston')
  , util = require('util');

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
  timestamp: true,
  level: 'debug',
  colorize: true
});

var logger = winston.loggers.add('console', {
  transports: [
    new (winston.transports.Console)({
      level: 'console',
      timestamp: true,
      colorize: true
    })
  ]
});

logger.setLevels({console: 4, debug: 3, info: 2, warn: 1, error: 0});
winston.addColors({console: 'america'});

function formatArgs(args){
  return [util.format.apply(util.format, Array.prototype.slice.call(args))];
}

console.log = function(){
  logger.console.apply(logger, formatArgs(arguments));
};
console.info = function(){
  logger.info.apply(logger, formatArgs(arguments));
};
console.warn = function(){
  logger.warn.apply(logger, formatArgs(arguments));
};
console.error = function(){
  logger.error.apply(logger, formatArgs(arguments));
};
console.debug = function(){
  logger.debug.apply(logger, formatArgs(arguments));
};

module.exports = winston;
