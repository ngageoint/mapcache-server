exports.process = function(source, callback) {
  var processor = require('./' + source.format);

  processor.process(source, callback);
}
