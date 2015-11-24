var winston = require('winston')
  , util = require('util');

winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
  timestamp: true,
  level: 'debug',
  colorize: true
});

var mongooseLogger = winston.loggers.add('mongoose', {
  transports: [
    new (winston.transports.Console)({
      level: 'mongoose',
      timestamp: true,
      colorize: true
    })
  ]
});

winston.addColors({mongoose: 'cyan'});
mongooseLogger.setLevels({ mongoose: 0});

var logger = new winston.Logger();

logger.add(winston.transports.Console, {
  colorize: true,
  timestamp: true,
  level: 'debug'
});

function formatArgs(args){
  return [util.format.apply(util.format, Array.prototype.slice.call(args))];
}

console.log = function(){
  logger.debug.apply(logger, formatArgs(arguments));
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
