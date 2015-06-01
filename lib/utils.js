function promisifyWithoutError(/*fn, self, args ...*/) {
  var args = Array.prototype.slice.call(arguments);
  var fn = args.shift();
  var self = args.shift();

  return new Promise(function (resolve, reject) {
    args.push(resolve);
    fn.apply(self, args);
  });
}
module.exports.promisifyWithoutError = promisifyWithoutError;

function promisify(/*fn, self, args ...*/) {
  var args = Array.prototype.slice.call(arguments);
  var fn = args.shift();
  var self = args.shift();

  return new Promise(function (resolve, reject) {
    args.push(function (/**err, ... */) {
      var args = Array.prototype.slice.call(arguments);
      var err = args.shift();

      if (err) {
        return reject(err);
      }

      resolve.apply(null, args);
    });
    fn.apply(self, args);
  });
}
module.exports.promisify = promisify;
