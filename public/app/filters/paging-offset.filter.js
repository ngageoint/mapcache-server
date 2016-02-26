module.exports = function offsetFilter() {
  return function(input, start, length) {
    start = parseInt(start, 10);
    if (length) {
      return input.slice(start, start+length);
    } else {
      return input.slice(start);
    }
  };
};
