Module = require('module');
Falafel = require('falafel');

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

  this.indent = 0;
  this._replaceCompile();
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

/**
 * Take over Node's compile method and add some logging of our own
 *
 * @access private
 */
Trace.prototype._replaceCompile = function() {

  var self = this;
  var original = Module.prototype._compile;

  Module.prototype._compile = function(content, filename) {

    var newFunctions = self._makeNewFunctions(content);

    original.call(this, newFunctions, filename);

  };
}

/**
 * Takes content from a module and modifies its functions to add logging
 *
 * @param {String} content, string containing file contents
 * @access private
 */
Trace.prototype._makeNewFunctions = function(content) {
  var self = this;
    var output = Falafel(content, {}, function(node) {
      // only trace function nodes
      if (node.type == 'FunctionDeclaration') {
        // e.g. function foo()
        var description = node.source().slice(0, node.body.range[0] - node.range[0]);

        // get function name 
        var funcName = description.slice(9, node.body.range[0] - node.range[0] - 3);

        // function contents
        var oldFunction = node.body.source().substring(1, node.body.source().length - 1);

        // construct new function contents
        var enterText = 'process.stderr.write("'+ new Array(self.indent+1).join("  ") + 'Entering ' + funcName + '\\n");';
        var leaveText = 'process.stderr.write("'+ new Array(self.indent+1).join("  ") + 'Leaving ' + funcName + '\\n");';
        var newFunction = enterText + oldFunction + leaveText;

        // update the node with our newly minted function, which includes logging
        node.update(description + '{' + newFunction + '}');
        self.indent++;
      } else if (node.type == 'FunctionExpression') {
        var funcName = node.name;

        var description = node.parent.parent.source().slice(0, node.body.range[0] - node.range[0]);

        // function contents
        var oldFunction = node.body.source().substring(1, node.body.source().length - 1);

        // construct new function contents
        var enterText = 'process.stderr.write("'+ new Array(self.indent+1).join("  ") + 'Entering ' + funcName + '\\n");';
        var leaveText = 'process.stderr.write("'+ new Array(self.indent+1).join("  ") + 'Leaving ' + funcName + '\\n");';
        var newFunction = enterText + oldFunction + leaveText;

        // update the node with our newly minted function, which includes logging
        node.body.update('{' + newFunction + '}');
        self.indent++;
      }

    });

    // return the new, modified content
    return output.toString();
}

module.exports = new Trace;
