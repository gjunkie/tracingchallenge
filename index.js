/**
 * Author: Freddie Carthy
 *
 * Trace before and after any number of passed in functions
 */
function Trace() {

  // object containing all functions to trace, including before and afters
  this.Tracers = {};

  // set up traces for all passed in funcitons
  for (var i = 0; i < arguments.length; i++) {
    var fName = _getName(arguments[i]);
    this.createTrace(fName, arguments[i]);
  }
}

/**
 * Return the function name as a string
 *
 * @param {Function} fn, function
 * @access private
 */
function _getName(fn) {
  if (fn.name !== '') return fn.name;

  return fn.toString();
}

/**
 * Trace before running function
 *
 * @param {Function} fn, function
 * @access private
 */
function _before(fn) {
  _log('before');
}

/**
 * Trace after running function
 *
 * @param {Function} fn, function
 * @access private
 */
function _after(fn) {
  _log('after');
}

/**
 * Make sure that the function is not already being traced 
 *
 * @param {String} fName, name of function to verify
 * @access private
 */
function _traced(tracers, fName) {
  if (tracers[fName]) return true;
}

/**
 * Log value to process.stderr 
 *
 * @param {String} value, string to log
 * @access private
 */
function _log(value) {
  process.stderr.write(value + '\n');
}

/**
 * Sets up trace for given function
 *
 * @param {String} name, function name 
 * @param {Function} fn, function to trace 
 * @access public
 */
Trace.prototype.createTrace = function(name, fn) {
  if (typeof name !== 'string') {
    return 'function name must be a string';
  }
  if (_isFunction(fn) && !_traced(this.Tracers, name)) {
    this.Tracers[name] = {
      original: fn,
      before: _before,
      after: _after
    };

    this.Tracers[name].before.apply(this);
    this.Tracers[name].original.apply(this);
    this.Tracers[name].after.apply(this);

  } else {
    _log(name + ' already traced, skipping.');
  }
}

/**
 * Verifies that we have a function before doing anything else
 *
 * @param {Function} fn, function to verify 
 * @access private
 */
function _isFunction(fn) {
  return (typeof fn === 'function');
}



function func() {
  console.log('running 1');
}
var func2 = function() {
  console.log('running 2');
}

var trace = new Trace();

trace.createTrace('test', func);
trace.createTrace('test2', func2);

module.exports = Trace;
