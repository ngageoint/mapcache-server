var winston = require('winston')
  , path = require('path')
  , PROJECT_ROOT = path.join(__dirname, '..');

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
  args = Array.prototype.slice.call(args);

   var stackInfo = getStackInfo(1);

   if (stackInfo) {
     // get file path relative to project root
     var calleeStr = '(' + stackInfo.relativePath + ':' + stackInfo.line + ')';

     if (typeof (args[0]) === 'string') {
       args[0] = calleeStr + ' ' + args[0];
     } else {
       args.unshift(calleeStr);
     }
   }

   return args;
 }

 /**
  * Parses and returns info about the call stack at the given index.
  */
 function getStackInfo (stackIndex) {
   // get call stack, and analyze it
   // get all file, method, and line numbers
   var stacklist = (new Error()).stack.split('\n').slice(3);

   // stack trace format:
   // http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
   // do not remove the regex expresses to outside of this method (due to a BUG in node.js)
   var stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi;
   var stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi;

   var s = stacklist[stackIndex] || stacklist[0];
   var sp = stackReg.exec(s) || stackReg2.exec(s);

   if (sp && sp.length === 5) {
     return {
       method: sp[1],
       relativePath: path.relative(PROJECT_ROOT, sp[2]),
       line: sp[3],
       pos: sp[4],
       file: path.basename(sp[2]),
       stack: stacklist.join('\n')
     };
   }
 }

// console.log = function(){
//   logger.console.apply(logger, formatArgs(arguments));
// };
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
