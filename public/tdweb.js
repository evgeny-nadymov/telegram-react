(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("tdweb", [], factory);
	else if(typeof exports === 'object')
		exports["tdweb"] = factory();
	else
		root["tdweb"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 9);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(13);


/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = false;



/***/ }),
/* 2 */
/***/ (function(module, exports) {

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

module.exports = _asyncToGenerator;

/***/ }),
/* 3 */
/***/ (function(module, exports) {

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

module.exports = _classCallCheck;

/***/ }),
/* 4 */
/***/ (function(module, exports) {

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

module.exports = _createClass;

/***/ }),
/* 5 */
/***/ (function(module, exports) {

function _typeof2(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof2 = function _typeof2(obj) { return typeof obj; }; } else { _typeof2 = function _typeof2(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof2(obj); }

function _typeof(obj) {
  if (typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol") {
    module.exports = _typeof = function _typeof(obj) {
      return _typeof2(obj);
    };
  } else {
    module.exports = _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : _typeof2(obj);
    };
  }

  return _typeof(obj);
}

module.exports = _typeof;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

var arrayWithHoles = __webpack_require__(10);

var iterableToArrayLimit = __webpack_require__(11);

var nonIterableRest = __webpack_require__(12);

function _slicedToArray(arr, i) {
  return arrayWithHoles(arr) || iterableToArrayLimit(arr, i) || nonIterableRest();
}

module.exports = _slicedToArray;

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = function() {
  return new Worker(__webpack_require__.p + "ead4614006a580316820.worker.js");
};

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

var rng = __webpack_require__(15);
var bytesToUuid = __webpack_require__(16);

function v4(options, buf, offset) {
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options === 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ++ii) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || bytesToUuid(rnds);
}

module.exports = v4;


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(17);


/***/ }),
/* 10 */
/***/ (function(module, exports) {

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

module.exports = _arrayWithHoles;

/***/ }),
/* 11 */
/***/ (function(module, exports) {

function _iterableToArrayLimit(arr, i) {
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

module.exports = _iterableToArrayLimit;

/***/ }),
/* 12 */
/***/ (function(module, exports) {

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
}

module.exports = _nonIterableRest;

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var runtime = (function (exports) {
  "use strict";

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  exports.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunctionPrototype[toStringTagSymbol] =
    GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      prototype[method] = function(arg) {
        return this._invoke(method, arg);
      };
    });
  }

  exports.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  exports.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  exports.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return Promise.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return Promise.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new Promise(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  exports.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  exports.async = function(innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList)
    );

    return exports.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        // Note: ["return"] must be used for ES3 parsing compatibility.
        if (delegate.iterator["return"]) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[toStringTagSymbol] = "Generator";

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  exports.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  exports.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  };

  // Regardless of whether this script is executing as a CommonJS module
  // or not, return the runtime object so that we can declare the variable
  // regeneratorRuntime in the outer scope, which allows this module to be
  // injected easily by `bin/regenerator --include-runtime script.js`.
  return exports;

}(
  // If this script is executing as a CommonJS module, use module.exports
  // as the regeneratorRuntime namespace. Otherwise create a new empty
  // object. Either way, the resulting object will be used to initialize
  // the regeneratorRuntime variable at the top of this file.
   true ? module.exports : undefined
));

try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  // This module should not be running in strict mode, so the above
  // assignment should always work unless something is misconfigured. Just
  // in case runtime.js accidentally runs in strict mode, we can escape
  // strict mode using a global Function call. This could conceivably fail
  // if a Content Security Policy forbids using Function, but in that case
  // the proper solution is to fix the accidental strict mode problem. If
  // you've misconfigured your bundler to force strict mode and applied a
  // CSP to forbid Function, and you're not willing to fix either of those
  // problems, please detail your unique predicament in a GitHub issue.
  Function("r", "regeneratorRuntime = r")(runtime);
}


/***/ }),
/* 14 */
/***/ (function(module, exports) {

/* (ignored) */

/***/ }),
/* 15 */
/***/ (function(module, exports) {

// Unique ID creation requires a high quality random # generator.  In the
// browser this is a little complicated due to unknown quality of Math.random()
// and inconsistent support for the `crypto` API.  We do the best we can via
// feature-detection

// getRandomValues needs to be invoked in a context where "this" is a Crypto
// implementation. Also, find the complete implementation of crypto on IE11.
var getRandomValues = (typeof(crypto) != 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto)) ||
                      (typeof(msCrypto) != 'undefined' && typeof window.msCrypto.getRandomValues == 'function' && msCrypto.getRandomValues.bind(msCrypto));

if (getRandomValues) {
  // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
  var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef

  module.exports = function whatwgRNG() {
    getRandomValues(rnds8);
    return rnds8;
  };
} else {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var rnds = new Array(16);

  module.exports = function mathRNG() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return rnds;
  };
}


/***/ }),
/* 16 */
/***/ (function(module, exports) {

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

function bytesToUuid(buf, offset) {
  var i = offset || 0;
  var bth = byteToHex;
  // join used to fix memory issue caused by concatenation: https://bugs.chromium.org/p/v8/issues/detail?id=3175#c4
  return ([bth[buf[i++]], bth[buf[i++]], 
	bth[buf[i++]], bth[buf[i++]], '-',
	bth[buf[i++]], bth[buf[i++]], '-',
	bth[buf[i++]], bth[buf[i++]], '-',
	bth[buf[i++]], bth[buf[i++]], '-',
	bth[buf[i++]], bth[buf[i++]],
	bth[buf[i++]], bth[buf[i++]],
	bth[buf[i++]], bth[buf[i++]]]).join('');
}

module.exports = bytesToUuid;


/***/ }),
/* 17 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);

// EXTERNAL MODULE: ./node_modules/@babel/runtime/helpers/typeof.js
var helpers_typeof = __webpack_require__(5);
var typeof_default = /*#__PURE__*/__webpack_require__.n(helpers_typeof);

// EXTERNAL MODULE: ./node_modules/@babel/runtime/helpers/slicedToArray.js
var slicedToArray = __webpack_require__(6);
var slicedToArray_default = /*#__PURE__*/__webpack_require__.n(slicedToArray);

// EXTERNAL MODULE: ./node_modules/@babel/runtime/regenerator/index.js
var regenerator = __webpack_require__(0);
var regenerator_default = /*#__PURE__*/__webpack_require__.n(regenerator);

// EXTERNAL MODULE: ./node_modules/@babel/runtime/helpers/asyncToGenerator.js
var asyncToGenerator = __webpack_require__(2);
var asyncToGenerator_default = /*#__PURE__*/__webpack_require__.n(asyncToGenerator);

// EXTERNAL MODULE: ./node_modules/@babel/runtime/helpers/classCallCheck.js
var classCallCheck = __webpack_require__(3);
var classCallCheck_default = /*#__PURE__*/__webpack_require__.n(classCallCheck);

// EXTERNAL MODULE: ./node_modules/@babel/runtime/helpers/createClass.js
var createClass = __webpack_require__(4);
var createClass_default = /*#__PURE__*/__webpack_require__.n(createClass);

// EXTERNAL MODULE: ./src/worker.js
var worker = __webpack_require__(7);
var worker_default = /*#__PURE__*/__webpack_require__.n(worker);

// CONCATENATED MODULE: ./node_modules/broadcast-channel/dist/es/util.js
/**
 * returns true if the given object is a promise
 */
function isPromise(obj) {
  if (obj && typeof obj.then === 'function') {
    return true;
  } else {
    return false;
  }
}
function sleep(time) {
  if (!time) time = 0;
  return new Promise(function (res) {
    return setTimeout(res, time);
  });
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
/**
 * https://stackoverflow.com/a/1349426/3443137
 */

function randomToken(length) {
  if (!length) length = 5;
  var text = '';
  var possible = 'abcdefghijklmnopqrstuvwxzy0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}
var lastMs = 0;
var additional = 0;
/**
 * returns the current time in micro-seconds,
 * WARNING: This is a pseudo-function
 * Performance.now is not reliable in webworkers, so we just make sure to never return the same time.
 * This is enough in browsers, and this function will not be used in nodejs.
 * The main reason for this hack is to ensure that BroadcastChannel behaves equal to production when it is used in fast-running unit tests.
 */

function microSeconds() {
  var ms = new Date().getTime();

  if (ms === lastMs) {
    additional++;
    return ms * 1000 + additional;
  } else {
    lastMs = ms;
    additional = 0;
    return ms * 1000;
  }
}
// EXTERNAL MODULE: ./node_modules/detect-node/browser.js
var browser = __webpack_require__(1);
var browser_default = /*#__PURE__*/__webpack_require__.n(browser);

// CONCATENATED MODULE: ./node_modules/broadcast-channel/dist/es/methods/native.js


var native_microSeconds = microSeconds;
var type = 'native';
function create(channelName) {
  var state = {
    messagesCallback: null,
    bc: new BroadcastChannel(channelName),
    subFns: [] // subscriberFunctions

  };

  state.bc.onmessage = function (msg) {
    if (state.messagesCallback) {
      state.messagesCallback(msg.data);
    }
  };

  return state;
}
function native_close(channelState) {
  channelState.bc.close();
  channelState.subFns = [];
}
function postMessage(channelState, messageJson) {
  channelState.bc.postMessage(messageJson, false);
}
function onMessage(channelState, fn, time) {
  channelState.messagesCallbackTime = time;
  channelState.messagesCallback = fn;
}
function canBeUsed() {
  /**
   * in the electron-renderer, isNode will be true even if we are in browser-context
   * so we also check if window is undefined
   */
  if (browser_default.a && typeof window === 'undefined') return false;

  if (typeof BroadcastChannel === 'function') {
    if (BroadcastChannel._pubkey) {
      throw new Error('BroadcastChannel: Do not overwrite window.BroadcastChannel with this module, this is not a polyfill');
    }

    return true;
  } else return false;
}
function averageResponseTime() {
  return 100;
}
/* harmony default export */ var methods_native = ({
  create: create,
  close: native_close,
  onMessage: onMessage,
  postMessage: postMessage,
  canBeUsed: canBeUsed,
  type: type,
  averageResponseTime: averageResponseTime,
  microSeconds: native_microSeconds
});
// CONCATENATED MODULE: ./node_modules/broadcast-channel/dist/es/oblivious-set.js
/**
 *
 *
 */
var ObliviousSet = function ObliviousSet(ttl) {
  this.ttl = ttl;
  this.set = new Set();
  this.timeMap = new Map();
  this.has = this.set.has.bind(this.set);
};

ObliviousSet.prototype = {
  add: function add(value) {
    this.timeMap.set(value, oblivious_set_now());
    this.set.add(value);

    _removeTooOldValues(this);
  },
  clear: function clear() {
    this.set.clear();
    this.timeMap.clear();
  }
};
function _removeTooOldValues(obliviousSet) {
  var olderThen = oblivious_set_now() - obliviousSet.ttl;
  var iterator = obliviousSet.set[Symbol.iterator]();

  while (true) {
    var value = iterator.next().value;
    if (!value) return; // no more elements

    var time = obliviousSet.timeMap.get(value);

    if (time < olderThen) {
      obliviousSet.timeMap["delete"](value);
      obliviousSet.set["delete"](value);
    } else {
      // we reached a value that is not old enough
      return;
    }
  }
}

function oblivious_set_now() {
  return new Date().getTime();
}

/* harmony default export */ var oblivious_set = (ObliviousSet);
// CONCATENATED MODULE: ./node_modules/broadcast-channel/dist/es/options.js
function fillOptionsWithDefaults(options) {
  if (!options) options = {};
  options = JSON.parse(JSON.stringify(options)); // main

  if (typeof options.webWorkerSupport === 'undefined') options.webWorkerSupport = true; // indexed-db

  if (!options.idb) options.idb = {}; //  after this time the messages get deleted

  if (!options.idb.ttl) options.idb.ttl = 1000 * 45;
  if (!options.idb.fallbackInterval) options.idb.fallbackInterval = 150; // localstorage

  if (!options.localstorage) options.localstorage = {};
  if (!options.localstorage.removeTimeout) options.localstorage.removeTimeout = 1000 * 60; // node

  if (!options.node) options.node = {};
  if (!options.node.ttl) options.node.ttl = 1000 * 60 * 2; // 2 minutes;

  if (typeof options.node.useFastPath === 'undefined') options.node.useFastPath = true;
  return options;
}
// CONCATENATED MODULE: ./node_modules/broadcast-channel/dist/es/methods/indexed-db.js
/**
 * this method uses indexeddb to store the messages
 * There is currently no observerAPI for idb
 * @link https://github.com/w3c/IndexedDB/issues/51
 */


var indexed_db_microSeconds = microSeconds;


var DB_PREFIX = 'pubkey.broadcast-channel-0-';
var OBJECT_STORE_ID = 'messages';
var indexed_db_type = 'idb';
function getIdb() {
  if (typeof indexedDB !== 'undefined') return indexedDB;
  if (typeof window.mozIndexedDB !== 'undefined') return window.mozIndexedDB;
  if (typeof window.webkitIndexedDB !== 'undefined') return window.webkitIndexedDB;
  if (typeof window.msIndexedDB !== 'undefined') return window.msIndexedDB;
  return false;
}
function createDatabase(channelName) {
  var IndexedDB = getIdb(); // create table

  var dbName = DB_PREFIX + channelName;
  var openRequest = IndexedDB.open(dbName, 1);

  openRequest.onupgradeneeded = function (ev) {
    var db = ev.target.result;
    db.createObjectStore(OBJECT_STORE_ID, {
      keyPath: 'id',
      autoIncrement: true
    });
  };

  var dbPromise = new Promise(function (res, rej) {
    openRequest.onerror = function (ev) {
      return rej(ev);
    };

    openRequest.onsuccess = function () {
      res(openRequest.result);
    };
  });
  return dbPromise;
}
/**
 * writes the new message to the database
 * so other readers can find it
 */

function writeMessage(db, readerUuid, messageJson) {
  var time = new Date().getTime();
  var writeObject = {
    uuid: readerUuid,
    time: time,
    data: messageJson
  };
  var transaction = db.transaction([OBJECT_STORE_ID], 'readwrite');
  return new Promise(function (res, rej) {
    transaction.oncomplete = function () {
      return res();
    };

    transaction.onerror = function (ev) {
      return rej(ev);
    };

    var objectStore = transaction.objectStore(OBJECT_STORE_ID);
    objectStore.add(writeObject);
  });
}
function getAllMessages(db) {
  var objectStore = db.transaction(OBJECT_STORE_ID).objectStore(OBJECT_STORE_ID);
  var ret = [];
  return new Promise(function (res) {
    objectStore.openCursor().onsuccess = function (ev) {
      var cursor = ev.target.result;

      if (cursor) {
        ret.push(cursor.value); //alert("Name for SSN " + cursor.key + " is " + cursor.value.name);

        cursor["continue"]();
      } else {
        res(ret);
      }
    };
  });
}
function getMessagesHigherThen(db, lastCursorId) {
  var objectStore = db.transaction(OBJECT_STORE_ID).objectStore(OBJECT_STORE_ID);
  var ret = [];
  var keyRangeValue = IDBKeyRange.bound(lastCursorId + 1, Infinity);
  return new Promise(function (res) {
    objectStore.openCursor(keyRangeValue).onsuccess = function (ev) {
      var cursor = ev.target.result;

      if (cursor) {
        ret.push(cursor.value); //alert("Name for SSN " + cursor.key + " is " + cursor.value.name);

        cursor["continue"]();
      } else {
        res(ret);
      }
    };
  });
}
function removeMessageById(db, id) {
  var request = db.transaction([OBJECT_STORE_ID], 'readwrite').objectStore(OBJECT_STORE_ID)["delete"](id);
  return new Promise(function (res) {
    request.onsuccess = function () {
      return res();
    };
  });
}
function getOldMessages(db, ttl) {
  var olderThen = new Date().getTime() - ttl;
  var objectStore = db.transaction(OBJECT_STORE_ID).objectStore(OBJECT_STORE_ID);
  var ret = [];
  return new Promise(function (res) {
    objectStore.openCursor().onsuccess = function (ev) {
      var cursor = ev.target.result;

      if (cursor) {
        var msgObk = cursor.value;

        if (msgObk.time < olderThen) {
          ret.push(msgObk); //alert("Name for SSN " + cursor.key + " is " + cursor.value.name);

          cursor["continue"]();
        } else {
          // no more old messages,
          res(ret);
          return;
        }
      } else {
        res(ret);
      }
    };
  });
}
function cleanOldMessages(db, ttl) {
  return getOldMessages(db, ttl).then(function (tooOld) {
    return Promise.all(tooOld.map(function (msgObj) {
      return removeMessageById(db, msgObj.id);
    }));
  });
}
function indexed_db_create(channelName, options) {
  options = fillOptionsWithDefaults(options);
  return createDatabase(channelName).then(function (db) {
    var state = {
      closed: false,
      lastCursorId: 0,
      channelName: channelName,
      options: options,
      uuid: randomToken(10),

      /**
       * emittedMessagesIds
       * contains all messages that have been emitted before
       * @type {ObliviousSet}
       */
      eMIs: new oblivious_set(options.idb.ttl * 2),
      // ensures we do not read messages in parrallel
      writeBlockPromise: Promise.resolve(),
      messagesCallback: null,
      readQueuePromises: [],
      db: db
    };
    /**
     * if service-workers are used,
     * we have no 'storage'-event if they post a message,
     * therefore we also have to set an interval
     */

    _readLoop(state);

    return state;
  });
}

function _readLoop(state) {
  if (state.closed) return;
  return readNewMessages(state).then(function () {
    return sleep(state.options.idb.fallbackInterval);
  }).then(function () {
    return _readLoop(state);
  });
}

function _filterMessage(msgObj, state) {
  if (msgObj.uuid === state.uuid) return false; // send by own

  if (state.eMIs.has(msgObj.id)) return false; // already emitted

  if (msgObj.data.time < state.messagesCallbackTime) return false; // older then onMessageCallback

  return true;
}
/**
 * reads all new messages from the database and emits them
 */


function readNewMessages(state) {
  // channel already closed
  if (state.closed) return Promise.resolve(); // if no one is listening, we do not need to scan for new messages

  if (!state.messagesCallback) return Promise.resolve();
  return getMessagesHigherThen(state.db, state.lastCursorId).then(function (newerMessages) {
    var useMessages = newerMessages.map(function (msgObj) {
      if (msgObj.id > state.lastCursorId) {
        state.lastCursorId = msgObj.id;
      }

      return msgObj;
    }).filter(function (msgObj) {
      return _filterMessage(msgObj, state);
    }).sort(function (msgObjA, msgObjB) {
      return msgObjA.time - msgObjB.time;
    }); // sort by time

    useMessages.forEach(function (msgObj) {
      if (state.messagesCallback) {
        state.eMIs.add(msgObj.id);
        state.messagesCallback(msgObj.data);
      }
    });
    return Promise.resolve();
  });
}

function indexed_db_close(channelState) {
  channelState.closed = true;
  channelState.db.close();
}
function indexed_db_postMessage(channelState, messageJson) {
  channelState.writeBlockPromise = channelState.writeBlockPromise.then(function () {
    return writeMessage(channelState.db, channelState.uuid, messageJson);
  }).then(function () {
    if (randomInt(0, 10) === 0) {
      /* await (do not await) */
      cleanOldMessages(channelState.db, channelState.options.idb.ttl);
    }
  });
  return channelState.writeBlockPromise;
}
function indexed_db_onMessage(channelState, fn, time) {
  channelState.messagesCallbackTime = time;
  channelState.messagesCallback = fn;
  readNewMessages(channelState);
}
function indexed_db_canBeUsed() {
  if (browser_default.a) return false;
  var idb = getIdb();
  if (!idb) return false;
  return true;
}
function indexed_db_averageResponseTime(options) {
  return options.idb.fallbackInterval * 2;
}
/* harmony default export */ var indexed_db = ({
  create: indexed_db_create,
  close: indexed_db_close,
  onMessage: indexed_db_onMessage,
  postMessage: indexed_db_postMessage,
  canBeUsed: indexed_db_canBeUsed,
  type: indexed_db_type,
  averageResponseTime: indexed_db_averageResponseTime,
  microSeconds: indexed_db_microSeconds
});
// CONCATENATED MODULE: ./node_modules/broadcast-channel/dist/es/methods/localstorage.js
/**
 * A localStorage-only method which uses localstorage and its 'storage'-event
 * This does not work inside of webworkers because they have no access to locastorage
 * This is basically implemented to support IE9 or your grandmothers toaster.
 * @link https://caniuse.com/#feat=namevalue-storage
 * @link https://caniuse.com/#feat=indexeddb
 */




var localstorage_microSeconds = microSeconds;
var KEY_PREFIX = 'pubkey.broadcastChannel-';
var localstorage_type = 'localstorage';
/**
 * copied from crosstab
 * @link https://github.com/tejacques/crosstab/blob/master/src/crosstab.js#L32
 */

function getLocalStorage() {
  var localStorage;
  if (typeof window === 'undefined') return null;

  try {
    localStorage = window.localStorage;
    localStorage = window['ie8-eventlistener/storage'] || window.localStorage;
  } catch (e) {// New versions of Firefox throw a Security exception
    // if cookies are disabled. See
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1028153
  }

  return localStorage;
}
function storageKey(channelName) {
  return KEY_PREFIX + channelName;
}
/**
* writes the new message to the storage
* and fires the storage-event so other readers can find it
*/

function localstorage_postMessage(channelState, messageJson) {
  return new Promise(function (res) {
    sleep().then(function () {
      var key = storageKey(channelState.channelName);
      var writeObj = {
        token: randomToken(10),
        time: new Date().getTime(),
        data: messageJson,
        uuid: channelState.uuid
      };
      var value = JSON.stringify(writeObj);
      localStorage.setItem(key, value);
      /**
       * StorageEvent does not fire the 'storage' event
       * in the window that changes the state of the local storage.
       * So we fire it manually
       */

      var ev = document.createEvent('Event');
      ev.initEvent('storage', true, true);
      ev.key = key;
      ev.newValue = value;
      window.dispatchEvent(ev);
      res();
    });
  });
}
function addStorageEventListener(channelName, fn) {
  var key = storageKey(channelName);

  var listener = function listener(ev) {
    if (ev.key === key) {
      fn(JSON.parse(ev.newValue));
    }
  };

  window.addEventListener('storage', listener);
  return listener;
}
function removeStorageEventListener(listener) {
  window.removeEventListener('storage', listener);
}
function localstorage_create(channelName, options) {
  options = fillOptionsWithDefaults(options);

  if (!localstorage_canBeUsed()) {
    throw new Error('BroadcastChannel: localstorage cannot be used');
  }

  var uuid = randomToken(10);
  /**
   * eMIs
   * contains all messages that have been emitted before
   * @type {ObliviousSet}
   */

  var eMIs = new oblivious_set(options.localstorage.removeTimeout);
  var state = {
    channelName: channelName,
    uuid: uuid,
    eMIs: eMIs // emittedMessagesIds

  };
  state.listener = addStorageEventListener(channelName, function (msgObj) {
    if (!state.messagesCallback) return; // no listener

    if (msgObj.uuid === uuid) return; // own message

    if (!msgObj.token || eMIs.has(msgObj.token)) return; // already emitted

    if (msgObj.data.time && msgObj.data.time < state.messagesCallbackTime) return; // too old

    eMIs.add(msgObj.token);
    state.messagesCallback(msgObj.data);
  });
  return state;
}
function localstorage_close(channelState) {
  removeStorageEventListener(channelState.listener);
}
function localstorage_onMessage(channelState, fn, time) {
  channelState.messagesCallbackTime = time;
  channelState.messagesCallback = fn;
}
function localstorage_canBeUsed() {
  if (browser_default.a) return false;
  var ls = getLocalStorage();
  if (!ls) return false;
  return true;
}
function localstorage_averageResponseTime() {
  return 120;
}
/* harmony default export */ var localstorage = ({
  create: localstorage_create,
  close: localstorage_close,
  onMessage: localstorage_onMessage,
  postMessage: localstorage_postMessage,
  canBeUsed: localstorage_canBeUsed,
  type: localstorage_type,
  averageResponseTime: localstorage_averageResponseTime,
  microSeconds: localstorage_microSeconds
});
// CONCATENATED MODULE: ./node_modules/broadcast-channel/dist/es/method-chooser.js
var require;


 // order is important

var METHODS = [methods_native, // fastest
indexed_db, localstorage];
var REQUIRE_FUN = require;
/**
 * The NodeMethod is loaded lazy
 * so it will not get bundled in browser-builds
 */

if (browser_default.a) {
  /**
   * we use the non-transpiled code for nodejs
   * because it runs faster
   */
  var NodeMethod = __webpack_require__(14);
  /**
   * this will be false for webpackbuilds
   * which will shim the node-method with an empty object {}
   */

  if (typeof NodeMethod.canBeUsed === 'function') {
    METHODS.push(NodeMethod);
  }
}

function chooseMethod(options) {
  // directly chosen
  if (options.type) {
    var ret = METHODS.find(function (m) {
      return m.type === options.type;
    });
    if (!ret) throw new Error('method-type ' + options.type + ' not found');else return ret;
  }

  var chooseMethods = METHODS;

  if (!options.webWorkerSupport && !browser_default.a) {
    // prefer localstorage over idb when no webworker-support needed
    chooseMethods = METHODS.filter(function (m) {
      return m.type !== 'idb';
    });
  }

  var useMethod = chooseMethods.find(function (method) {
    return method.canBeUsed();
  });
  if (!useMethod) throw new Error('No useable methode found:' + JSON.stringify(METHODS.map(function (m) {
    return m.type;
  })));else return useMethod;
}
// CONCATENATED MODULE: ./node_modules/broadcast-channel/dist/es/index.js




var es_BroadcastChannel = function BroadcastChannel(name, options) {
  this.name = name;
  this.options = fillOptionsWithDefaults(options);
  this.method = chooseMethod(this.options); // isListening

  this._iL = false;
  /**
   * _onMessageListener
   * setting onmessage twice,
   * will overwrite the first listener
   */

  this._onML = null;
  /**
   * _addEventListeners
   */

  this._addEL = {
    message: [],
    internal: []
  };
  /**
   * _beforeClose
   * array of promises that will be awaited
   * before the channel is closed
   */

  this._befC = [];
  /**
   * _preparePromise
   */

  this._prepP = null;

  _prepareChannel(this);
}; // STATICS

/**
 * used to identify if someone overwrites
 * window.BroadcastChannel with this
 * See methods/native.js
 */


es_BroadcastChannel._pubkey = true;
/**
 * clears the tmp-folder if is node
 * @return {Promise<boolean>} true if has run, false if not node
 */

es_BroadcastChannel.clearNodeFolder = function (options) {
  options = fillOptionsWithDefaults(options);
  var method = chooseMethod(options);

  if (method.type === 'node') {
    return method.clearNodeFolder().then(function () {
      return true;
    });
  } else {
    return Promise.resolve(false);
  }
}; // PROTOTYPE


es_BroadcastChannel.prototype = {
  postMessage: function postMessage(msg) {
    if (this.closed) {
      throw new Error('BroadcastChannel.postMessage(): ' + 'Cannot post message after channel has closed');
    }

    return _post(this, 'message', msg);
  },
  postInternal: function postInternal(msg) {
    return _post(this, 'internal', msg);
  },

  set onmessage(fn) {
    var time = this.method.microSeconds();
    var listenObj = {
      time: time,
      fn: fn
    };

    _removeListenerObject(this, 'message', this._onML);

    if (fn && typeof fn === 'function') {
      this._onML = listenObj;

      _addListenerObject(this, 'message', listenObj);
    } else {
      this._onML = null;
    }
  },

  addEventListener: function addEventListener(type, fn) {
    var time = this.method.microSeconds();
    var listenObj = {
      time: time,
      fn: fn
    };

    _addListenerObject(this, type, listenObj);
  },
  removeEventListener: function removeEventListener(type, fn) {
    var obj = this._addEL[type].find(function (obj) {
      return obj.fn === fn;
    });

    _removeListenerObject(this, type, obj);
  },
  close: function close() {
    var _this = this;

    if (this.closed) return;
    this.closed = true;
    var awaitPrepare = this._prepP ? this._prepP : Promise.resolve();
    this._onML = null;
    this._addEL.message = [];
    return awaitPrepare.then(function () {
      return Promise.all(_this._befC.map(function (fn) {
        return fn();
      }));
    }).then(function () {
      return _this.method.close(_this._state);
    });
  },

  get type() {
    return this.method.type;
  }

};

function _post(broadcastChannel, type, msg) {
  var time = broadcastChannel.method.microSeconds();
  var msgObj = {
    time: time,
    type: type,
    data: msg
  };
  var awaitPrepare = broadcastChannel._prepP ? broadcastChannel._prepP : Promise.resolve();
  return awaitPrepare.then(function () {
    return broadcastChannel.method.postMessage(broadcastChannel._state, msgObj);
  });
}

function _prepareChannel(channel) {
  var maybePromise = channel.method.create(channel.name, channel.options);

  if (isPromise(maybePromise)) {
    channel._prepP = maybePromise;
    maybePromise.then(function (s) {
      // used in tests to simulate slow runtime

      /*if (channel.options.prepareDelay) {
           await new Promise(res => setTimeout(res, this.options.prepareDelay));
      }*/
      channel._state = s;
    });
  } else {
    channel._state = maybePromise;
  }
}

function _hasMessageListeners(channel) {
  if (channel._addEL.message.length > 0) return true;
  if (channel._addEL.internal.length > 0) return true;
  return false;
}

function _addListenerObject(channel, type, obj) {
  channel._addEL[type].push(obj);

  _startListening(channel);
}

function _removeListenerObject(channel, type, obj) {
  channel._addEL[type] = channel._addEL[type].filter(function (o) {
    return o !== obj;
  });

  _stopListening(channel);
}

function _startListening(channel) {
  if (!channel._iL && _hasMessageListeners(channel)) {
    // someone is listening, start subscribing
    var listenerFn = function listenerFn(msgObj) {
      channel._addEL[msgObj.type].forEach(function (obj) {
        if (msgObj.time >= obj.time) {
          obj.fn(msgObj.data);
        }
      });
    };

    var time = channel.method.microSeconds();

    if (channel._prepP) {
      channel._prepP.then(function () {
        channel._iL = true;
        channel.method.onMessage(channel._state, listenerFn, time);
      });
    } else {
      channel._iL = true;
      channel.method.onMessage(channel._state, listenerFn, time);
    }
  }
}

function _stopListening(channel) {
  if (channel._iL && !_hasMessageListeners(channel)) {
    // noone is listening, stop subscribing
    channel._iL = false;
    var time = channel.method.microSeconds();
    channel.method.onMessage(channel._state, null, time);
  }
}

/* harmony default export */ var es = (es_BroadcastChannel);
// EXTERNAL MODULE: ./node_modules/uuid/v4.js
var v4 = __webpack_require__(8);
var v4_default = /*#__PURE__*/__webpack_require__.n(v4);

// CONCATENATED MODULE: ./src/logger.js



var logger_Logger =
/*#__PURE__*/
function () {
  function Logger() {
    classCallCheck_default()(this, Logger);

    this.setVerbosity('WARNING');
  }

  createClass_default()(Logger, [{
    key: "debug",
    value: function debug() {
      if (this.checkVerbosity(4)) {
        var _console;

        (_console = console).log.apply(_console, arguments);
      }
    }
  }, {
    key: "log",
    value: function log() {
      if (this.checkVerbosity(4)) {
        var _console2;

        (_console2 = console).log.apply(_console2, arguments);
      }
    }
  }, {
    key: "info",
    value: function info() {
      if (this.checkVerbosity(3)) {
        var _console3;

        (_console3 = console).info.apply(_console3, arguments);
      }
    }
  }, {
    key: "warn",
    value: function warn() {
      if (this.checkVerbosity(2)) {
        var _console4;

        (_console4 = console).warn.apply(_console4, arguments);
      }
    }
  }, {
    key: "error",
    value: function error() {
      if (this.checkVerbosity(1)) {
        var _console5;

        (_console5 = console).error.apply(_console5, arguments);
      }
    }
  }, {
    key: "setVerbosity",
    value: function setVerbosity(level) {
      var default_level = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'info';

      if (level === undefined) {
        level = default_level;
      }

      if (typeof level === 'string') {
        level = {
          ERROR: 1,
          WARNING: 2,
          INFO: 3,
          LOG: 4,
          DEBUG: 4
        }[level.toUpperCase()] || 2;
      }

      this.level = level;
    }
  }, {
    key: "checkVerbosity",
    value: function checkVerbosity(level) {
      return this.level >= level;
    }
  }]);

  return Logger;
}();

var log = new logger_Logger();
/* harmony default export */ var logger = (log);
// CONCATENATED MODULE: ./src/index.js






 //import localforage from 'localforage';





var src_sleep = function sleep(ms) {
  return new Promise(function (res) {
    return setTimeout(res, ms);
  });
};
/**
 * TDLib in a browser
 *
 * TDLib can be compiled to WebAssembly or asm.js using Emscripten compiler and used in a browser from JavaScript.
 * This is a convenient wrapper for TDLib in a browser which controls TDLib instance creation, handles interaction
 * with TDLib and manages a filesystem for persistent TDLib data.
 * TDLib instance is created in a Web Worker to run it in a separate thread.
 * TdClient just sends queries to the Web Worker and receives updates and results from it.
 * <br>
 * <br>
 * Differences from the TDLib JSON API:<br>
 * 1. Added the update <code>updateFatalError error:string = Update;</code> which is sent whenever TDLib encounters a fatal error.<br>
 * 2. Added the method <code>setJsLogVerbosityLevel new_verbosity_level:string = Ok;</code>, which allows to change the verbosity level of tdweb logging.<br>
 * 3. Added the possibility to use blobs as input files via the constructor <code>inputFileBlob data:<JavaScript blob> = InputFile;</code>.<br>
 * 4. The class <code>filePart</code> contains data as a JavaScript blob instead of a base64-encoded string.<br>
 * 5. The methods <code>getStorageStatistics</code>, <code>getStorageStatisticsFast</code>, <code>optimizeStorage</code>, <code>addProxy</code> and <code>getFileDownloadedPrefixSize</code> are not supported.<br>
 * <br>
 */


var src_TdClient =
/*#__PURE__*/
function () {
  /**
   * @callback TdClient~updateCallback
   * @param {Object} update The update.
   */

  /**
   * Create TdClient.
   * @param {Object} options - Options for TDLib instance creation.
   * @param {TdClient~updateCallback} options.onUpdate - Callback for all incoming updates.
   * @param {string} [options.instanceName=tdlib] - Name of the TDLib instance. Currently only one instance of TdClient with a given name is allowed. All but one instances with the same name will be automatically closed. Usually, the newest non-background instance is kept alive. Files will be stored in an IndexedDb table with the same name.
   * @param {boolean} [options.isBackground=false] - Pass true, if the instance is opened from the background.
   * @param {string} [options.jsLogVerbosityLevel=info] - The initial verbosity level of the JavaScript part of the code (one of 'error', 'warning', 'info', 'log', 'debug').
   * @param {number} [options.logVerbosityLevel=2] - The initial verbosity level for the TDLib internal logging (0-1023).
   * @param {boolean} [options.useDatabase=true] - Pass false to use TDLib without database and secret chats. It will significantly improve loading time, but some functionality will be unavailable.
   * @param {boolean} [options.readOnly=false] - For debug only. Pass true to open TDLib database in read-only mode
   * @param {string} [options.mode=auto] - For debug only. The type of the TDLib build to use. 'asmjs' for asm.js and 'wasm' for WebAssembly. If mode == 'auto' WebAbassembly will be used if supported by browser, asm.js otherwise.
   */
  function TdClient(options) {
    var _this = this;

    classCallCheck_default()(this, TdClient);

    logger.setVerbosity(options.jsLogVerbosityLevel);
    this.worker = new worker_default.a();

    this.worker.onmessage = function (e) {
      _this.onResponse(e.data);
    };

    this.query_id = 0;
    this.query_callbacks = new Map();

    if ('onUpdate' in options) {
      this.onUpdate = options.onUpdate;
      delete options.onUpdate;
    }

    options.instanceName = options.instanceName || 'tdlib';
    this.fileManager = new src_FileManager(options.instanceName, this);
    this.worker.postMessage({
      '@type': 'init',
      options: options
    });
    this.closeOtherClients(options);
  }
  /**
   * Send a query to TDLib.
   *
   * If the query contains the field '@extra', the same field will be added into the result.
   *
   * @param {Object} query - The query for TDLib. See the [td_api.tl]{@link https://github.com/tdlib/td/blob/master/td/generate/scheme/td_api.tl} scheme or
   *                         the automatically generated [HTML documentation]{@link https://core.telegram.org/tdlib/docs/td__api_8h.html}
   *                         for a list of all available TDLib [methods]{@link https://core.telegram.org/tdlib/docs/classtd_1_1td__api_1_1_function.html} and
   *                         [classes]{@link https://core.telegram.org/tdlib/docs/classtd_1_1td__api_1_1_object.html}.
   * @returns {Promise} Promise object represents the result of the query.
   */


  createClass_default()(TdClient, [{
    key: "send",
    value: function send(query) {
      return this.doSend(query, true);
    }
    /** @private */

  }, {
    key: "sendInternal",
    value: function sendInternal(query) {
      return this.doSend(query, false);
    }
    /** @private */

  }, {
    key: "doSend",
    value: function doSend(query, isExternal) {
      var _this2 = this;

      this.query_id++;

      if (query['@extra']) {
        query['@extra'] = {
          '@old_extra': JSON.parse(JSON.stringify(query['@extra'])),
          query_id: this.query_id
        };
      } else {
        query['@extra'] = {
          query_id: this.query_id
        };
      }

      if (query['@type'] === 'setJsLogVerbosityLevel') {
        logger.setVerbosity(query.new_verbosity_level);
      }

      logger.debug('send to worker: ', query);
      var res = new Promise(function (resolve, reject) {
        _this2.query_callbacks.set(_this2.query_id, [resolve, reject]);
      });

      if (isExternal) {
        this.externalPostMessage(query);
      } else {
        this.worker.postMessage(query);
      }

      return res;
    }
    /** @private */

  }, {
    key: "externalPostMessage",
    value: function externalPostMessage(query) {
      var unsupportedMethods = ['getStorageStatistics', 'getStorageStatisticsFast', 'optimizeStorage', 'addProxy', 'init', 'start'];

      if (unsupportedMethods.includes(query['@type'])) {
        this.onResponse({
          '@type': 'error',
          '@extra': query['@extra'],
          code: 400,
          message: "Method '" + query['@type'] + "' is not supported"
        });
        return;
      }

      if (query['@type'] === 'readFile' || query['@type'] === 'readFilePart') {
        this.readFile(query);
        return;
      }

      if (query['@type'] === 'deleteFile') {
        this.deleteFile(query);
        return;
      }

      this.worker.postMessage(query);
    }
    /** @private */

  }, {
    key: "readFile",
    value: function () {
      var _readFile = asyncToGenerator_default()(
      /*#__PURE__*/
      regenerator_default.a.mark(function _callee(query) {
        var response;
        return regenerator_default.a.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.fileManager.readFile(query);

              case 2:
                response = _context.sent;
                this.onResponse(response);

              case 4:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function readFile(_x) {
        return _readFile.apply(this, arguments);
      }

      return readFile;
    }()
    /** @private */

  }, {
    key: "deleteFile",
    value: function () {
      var _deleteFile = asyncToGenerator_default()(
      /*#__PURE__*/
      regenerator_default.a.mark(function _callee2(query) {
        var response;
        return regenerator_default.a.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                response = this.fileManager.deleteFile(query);
                _context2.prev = 1;

                if (!response.idb_key) {
                  _context2.next = 6;
                  break;
                }

                _context2.next = 5;
                return this.sendInternal({
                  '@type': 'deleteIdbKey',
                  idb_key: response.idb_key
                });

              case 5:
                delete response.idb_key;

              case 6:
                _context2.next = 8;
                return this.sendInternal({
                  '@type': 'deleteFile',
                  file_id: query.file_id
                });

              case 8:
                _context2.next = 12;
                break;

              case 10:
                _context2.prev = 10;
                _context2.t0 = _context2["catch"](1);

              case 12:
                this.onResponse(response);

              case 13:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this, [[1, 10]]);
      }));

      function deleteFile(_x2) {
        return _deleteFile.apply(this, arguments);
      }

      return deleteFile;
    }()
    /** @private */

  }, {
    key: "onResponse",
    value: function onResponse(response) {
      logger.debug('receive from worker: ', JSON.parse(JSON.stringify(response, function (key, value) {
        if (key === 'arr') {
          return undefined;
        }

        return value;
      }))); // for FileManager

      response = this.prepareResponse(response);

      if ('@extra' in response) {
        var query_id = response['@extra'].query_id;

        var _this$query_callbacks = this.query_callbacks.get(query_id),
            _this$query_callbacks2 = slicedToArray_default()(_this$query_callbacks, 2),
            resolve = _this$query_callbacks2[0],
            reject = _this$query_callbacks2[1];

        this.query_callbacks["delete"](query_id);

        if ('@old_extra' in response['@extra']) {
          response['@extra'] = response['@extra']['@old_extra'];
        }

        if (resolve) {
          if (response['@type'] === 'error') {
            reject(response);
          } else {
            resolve(response);
          }
        }
      } else {
        if (response['@type'] === 'inited') {
          this.onInited();
          return;
        }

        if (response['@type'] === 'fsInited') {
          this.onFsInited();
          return;
        }

        if (response['@type'] === 'updateAuthorizationState' && response.authorization_state['@type'] === 'authorizationStateClosed') {
          this.onClosed();
        }

        this.onUpdate(response);
      }
    }
    /** @private */

  }, {
    key: "prepareFile",
    value: function prepareFile(file) {
      return this.fileManager.registerFile(file);
    }
    /** @private */

  }, {
    key: "prepareResponse",
    value: function prepareResponse(response) {
      var _this3 = this;

      if (response['@type'] === 'file') {
        if (false) {}

        return this.prepareFile(response);
      }

      for (var key in response) {
        var field = response[key];

        if (field && typeof_default()(field) === 'object') {
          response[key] = this.prepareResponse(field);
        }
      }

      return response;
    }
    /** @private */

  }, {
    key: "onBroadcastMessage",
    value: function onBroadcastMessage(e) {
      //const message = e.data;
      var message = e;

      if (message.uid === this.uid) {
        logger.info('ignore self broadcast message: ', message);
        return;
      }

      logger.info('got broadcast message: ', message);

      if (message.isBackground && !this.isBackground) {// continue
      } else if (!message.isBackground && this.isBackground || message.timestamp > this.timestamp) {
        this.close();
        return;
      }

      if (message.state === 'closed') {
        this.waitSet["delete"](message.uid);

        if (this.waitSet.size === 0) {
          logger.info('onWaitSetEmpty');
          this.onWaitSetEmpty();

          this.onWaitSetEmpty = function () {};
        }
      } else {
        this.waitSet.add(message.uid);

        if (message.state !== 'closing') {
          this.postState();
        }
      }
    }
    /** @private */

  }, {
    key: "postState",
    value: function postState() {
      var state = {
        uid: this.uid,
        state: this.state,
        timestamp: this.timestamp,
        isBackground: this.isBackground
      };
      logger.info('Post state: ', state);
      this.channel.postMessage(state);
    }
    /** @private */

  }, {
    key: "onWaitSetEmpty",
    value: function onWaitSetEmpty() {} // nop

    /** @private */

  }, {
    key: "onFsInited",
    value: function onFsInited() {
      this.fileManager.init();
    }
    /** @private */

  }, {
    key: "onInited",
    value: function onInited() {
      this.isInited = true;
      this.doSendStart();
    }
    /** @private */

  }, {
    key: "sendStart",
    value: function sendStart() {
      this.wantSendStart = true;
      this.doSendStart();
    }
    /** @private */

  }, {
    key: "doSendStart",
    value: function doSendStart() {
      if (!this.isInited || !this.wantSendStart || this.state !== 'start') {
        return;
      }

      this.wantSendStart = false;
      this.state = 'active';
      var query = {
        '@type': 'start'
      };
      logger.info('send to worker: ', query);
      this.worker.postMessage(query);
    }
    /** @private */

  }, {
    key: "onClosed",
    value: function onClosed() {
      this.isClosing = true;
      this.worker.terminate();
      logger.info('worker is terminated');
      this.state = 'closed';
      this.postState();
    }
    /** @private */

  }, {
    key: "close",
    value: function close() {
      if (this.isClosing) {
        return;
      }

      this.isClosing = true;
      logger.info('close state: ', this.state);

      if (this.state === 'start') {
        this.onClosed();
        this.onUpdate({
          '@type': 'updateAuthorizationState',
          authorization_state: {
            '@type': 'authorizationStateClosed'
          }
        });
        return;
      }

      var query = {
        '@type': 'close'
      };
      logger.info('send to worker: ', query);
      this.worker.postMessage(query);
      this.state = 'closing';
      this.postState();
    }
    /** @private */

  }, {
    key: "closeOtherClients",
    value: function () {
      var _closeOtherClients = asyncToGenerator_default()(
      /*#__PURE__*/
      regenerator_default.a.mark(function _callee4(options) {
        var _this4 = this;

        return regenerator_default.a.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                this.uid = v4_default()();
                this.state = 'start';
                this.isBackground = !!options.isBackground;
                this.timestamp = Date.now();
                this.waitSet = new Set();
                logger.info('close other clients');
                this.channel = new es(options.instanceName, {
                  webWorkerSupport: false
                });
                this.postState();

                this.channel.onmessage = function (message) {
                  _this4.onBroadcastMessage(message);
                };

                _context4.next = 11;
                return src_sleep(300);

              case 11:
                if (!(this.waitSet.size !== 0)) {
                  _context4.next = 14;
                  break;
                }

                _context4.next = 14;
                return new Promise(function (resolve) {
                  _this4.onWaitSetEmpty = resolve;
                });

              case 14:
                this.sendStart();

              case 15:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function closeOtherClients(_x3) {
        return _closeOtherClients.apply(this, arguments);
      }

      return closeOtherClients;
    }()
    /** @private */

  }, {
    key: "onUpdate",
    value: function onUpdate(update) {
      logger.info('ignore onUpdate'); //nop
    }
  }]);

  return TdClient;
}();
/** @private */


var src_ListNode =
/*#__PURE__*/
function () {
  function ListNode(value) {
    classCallCheck_default()(this, ListNode);

    this.value = value;
    this.clear();
  }

  createClass_default()(ListNode, [{
    key: "erase",
    value: function erase() {
      this.prev.connect(this.next);
      this.clear();
    }
  }, {
    key: "clear",
    value: function clear() {
      this.prev = this;
      this.next = this;
    }
  }, {
    key: "connect",
    value: function connect(other) {
      this.next = other;
      other.prev = this;
    }
  }, {
    key: "onUsed",
    value: function onUsed(other) {
      other.usedAt = Date.now();
      other.erase();
      other.connect(this.next);
      logger.debug('LRU: used file_id: ', other.value);
      this.connect(other);
    }
  }, {
    key: "getLru",
    value: function getLru() {
      if (this === this.next) {
        throw new Error('popLru from empty list');
      }

      return this.prev;
    }
  }]);

  return ListNode;
}();
/** @private */


var src_FileManager =
/*#__PURE__*/
function () {
  function FileManager(instanceName, client) {
    classCallCheck_default()(this, FileManager);

    this.instanceName = instanceName;
    this.cache = new Map();
    this.pending = [];
    this.transaction_id = 0;
    this.totalSize = 0;
    this.lru = new src_ListNode(-1);
    this.client = client;
  }

  createClass_default()(FileManager, [{
    key: "init",
    value: function init() {
      var _this5 = this;

      this.idb = new Promise(function (resolve, reject) {
        var request = indexedDB.open(_this5.instanceName);

        request.onsuccess = function () {
          return resolve(request.result);
        };

        request.onerror = function () {
          return reject(request.error);
        };
      }); //this.store = localforage.createInstance({
      //name: instanceName
      //});

      this.isInited = true;
    }
  }, {
    key: "unload",
    value: function unload(info) {
      if (info.arr) {
        logger.debug('LRU: delete file_id: ', info.node.value, ' with arr.length: ', info.arr.length);
        this.totalSize -= info.arr.length;
        delete info.arr;
      }

      if (info.node) {
        info.node.erase();
        delete info.node;
      }
    }
  }, {
    key: "registerFile",
    value: function registerFile(file) {
      if (file.idb_key || file.arr) {
        file.local.is_downloading_completed = true;
      } else {
        file.local.is_downloading_completed = false;
      }

      var info = {};
      var cached_info = this.cache.get(file.id);

      if (cached_info) {
        info = cached_info;
      } else {
        this.cache.set(file.id, info);
      }

      if (file.idb_key) {
        info.idb_key = file.idb_key;
        delete file.idb_key;
      } else {
        delete info.idb_key;
      }

      if (file.arr) {
        var now = Date.now();

        while (this.totalSize > 100000000) {
          var node = this.lru.getLru(); // immunity for 60 seconds

          if (node.usedAt + 60 * 1000 > now) {
            break;
          }

          var lru_info = this.cache.get(node.value);
          this.unload(lru_info);
        }

        if (info.arr) {
          logger.warn('Got file.arr at least twice for the same file');
          this.totalSize -= info.arr.length;
        }

        info.arr = file.arr;
        delete file.arr;
        this.totalSize += info.arr.length;

        if (!info.node) {
          logger.debug('LRU: create file_id: ', file.id, ' with arr.length: ', info.arr.length);
          info.node = new src_ListNode(file.id);
        }

        this.lru.onUsed(info.node);
        logger.info('Total file.arr size: ', this.totalSize);
      }

      info.file = file;
      return file;
    }
  }, {
    key: "flushLoad",
    value: function () {
      var _flushLoad = asyncToGenerator_default()(
      /*#__PURE__*/
      regenerator_default.a.mark(function _callee5() {
        var pending, idb, transaction_id, read, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _loop, _iterator, _step;

        return regenerator_default.a.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                pending = this.pending;
                this.pending = [];
                _context5.next = 4;
                return this.idb;

              case 4:
                idb = _context5.sent;
                transaction_id = this.transaction_id++;
                read = idb.transaction(['keyvaluepairs'], 'readonly').objectStore('keyvaluepairs');
                logger.debug('Load group of files from idb', pending.length);
                _iteratorNormalCompletion = true;
                _didIteratorError = false;
                _iteratorError = undefined;
                _context5.prev = 11;

                _loop = function _loop() {
                  var query = _step.value;
                  var request = read.get(query.key);

                  request.onsuccess = function (event) {
                    var blob = event.target.result;

                    if (blob) {
                      if (blob.size === 0) {
                        logger.error('Got empty blob from db ', query.key);
                      }

                      query.resolve({
                        data: blob,
                        transaction_id: transaction_id
                      });
                    } else {
                      query.reject();
                    }
                  };

                  request.onerror = function () {
                    return query.reject(request.error);
                  };
                };

                for (_iterator = pending[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                  _loop();
                }

                _context5.next = 20;
                break;

              case 16:
                _context5.prev = 16;
                _context5.t0 = _context5["catch"](11);
                _didIteratorError = true;
                _iteratorError = _context5.t0;

              case 20:
                _context5.prev = 20;
                _context5.prev = 21;

                if (!_iteratorNormalCompletion && _iterator["return"] != null) {
                  _iterator["return"]();
                }

              case 23:
                _context5.prev = 23;

                if (!_didIteratorError) {
                  _context5.next = 26;
                  break;
                }

                throw _iteratorError;

              case 26:
                return _context5.finish(23);

              case 27:
                return _context5.finish(20);

              case 28:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this, [[11, 16, 20, 28], [21,, 23, 27]]);
      }));

      function flushLoad() {
        return _flushLoad.apply(this, arguments);
      }

      return flushLoad;
    }()
  }, {
    key: "load",
    value: function load(key, resolve, reject) {
      var _this6 = this;

      if (this.pending.length === 0) {
        setTimeout(function () {
          _this6.flushLoad();
        }, 1);
      }

      this.pending.push({
        key: key,
        resolve: resolve,
        reject: reject
      });
    }
  }, {
    key: "doLoadFull",
    value: function () {
      var _doLoadFull = asyncToGenerator_default()(
      /*#__PURE__*/
      regenerator_default.a.mark(function _callee6(info) {
        var _this7 = this;

        var idb_key;
        return regenerator_default.a.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (!info.arr) {
                  _context6.next = 2;
                  break;
                }

                return _context6.abrupt("return", {
                  data: new Blob([info.arr]),
                  transaction_id: -1
                });

              case 2:
                if (!info.idb_key) {
                  _context6.next = 7;
                  break;
                }

                idb_key = info.idb_key; //return this.store.getItem(idb_key);

                _context6.next = 6;
                return new Promise(function (resolve, reject) {
                  _this7.load(idb_key, resolve, reject);
                });

              case 6:
                return _context6.abrupt("return", _context6.sent);

              case 7:
                throw new Error('File is not loaded');

              case 8:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6);
      }));

      function doLoadFull(_x4) {
        return _doLoadFull.apply(this, arguments);
      }

      return doLoadFull;
    }()
  }, {
    key: "doLoad",
    value: function () {
      var _doLoad = asyncToGenerator_default()(
      /*#__PURE__*/
      regenerator_default.a.mark(function _callee7(info, offset, size) {
        var count, _res, res, data_size;

        return regenerator_default.a.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                if (!(!info.arr && !info.idb_key && info.file.local.path)) {
                  _context7.next = 24;
                  break;
                }

                _context7.prev = 1;
                _context7.next = 4;
                return this.client.sendInternal({
                  '@type': 'getFileDownloadedPrefixSize',
                  file_id: info.file.id,
                  offset: offset
                });

              case 4:
                count = _context7.sent;
                logger.error(count, size);

                if (size) {
                  _context7.next = 10;
                  break;
                }

                size = count.count;
                _context7.next = 12;
                break;

              case 10:
                if (!(size > count.count)) {
                  _context7.next = 12;
                  break;
                }

                throw new Error('File not loaded yet');

              case 12:
                _context7.next = 14;
                return this.client.sendInternal({
                  '@type': 'readFilePart',
                  path: info.file.local.path,
                  offset: offset,
                  size: size
                });

              case 14:
                _res = _context7.sent;
                _res.data = new Blob([_res.data]);
                _res.transaction_id = -2;
                logger.error(_res);
                return _context7.abrupt("return", _res);

              case 21:
                _context7.prev = 21;
                _context7.t0 = _context7["catch"](1);
                logger.info('readFilePart failed', info, offset, size, _context7.t0);

              case 24:
                _context7.next = 26;
                return this.doLoadFull(info);

              case 26:
                res = _context7.sent;
                // return slice(size, offset + size)
                data_size = res.data.size;

                if (!size) {
                  size = data_size;
                }

                if (offset > data_size) {
                  offset = data_size;
                }

                res.data = res.data.slice(offset, offset + size);
                return _context7.abrupt("return", res);

              case 32:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this, [[1, 21]]);
      }));

      function doLoad(_x5, _x6, _x7) {
        return _doLoad.apply(this, arguments);
      }

      return doLoad;
    }()
  }, {
    key: "doDelete",
    value: function doDelete(info) {
      this.unload(info);
      return info.idb_key;
    }
  }, {
    key: "readFile",
    value: function () {
      var _readFile2 = asyncToGenerator_default()(
      /*#__PURE__*/
      regenerator_default.a.mark(function _callee8(query) {
        var info, response;
        return regenerator_default.a.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                _context8.prev = 0;

                if (this.isInited) {
                  _context8.next = 3;
                  break;
                }

                throw new Error('FileManager is not inited');

              case 3:
                info = this.cache.get(query.file_id);

                if (info) {
                  _context8.next = 6;
                  break;
                }

                throw new Error('File is not loaded');

              case 6:
                if (info.node) {
                  this.lru.onUsed(info.node);
                }

                query.offset = query.offset || 0;
                query.size = query.size || 0;
                _context8.next = 11;
                return this.doLoad(info, query.offset, query.size);

              case 11:
                response = _context8.sent;
                return _context8.abrupt("return", {
                  '@type': 'filePart',
                  '@extra': query['@extra'],
                  data: response.data,
                  transaction_id: response.transaction_id
                });

              case 15:
                _context8.prev = 15;
                _context8.t0 = _context8["catch"](0);
                return _context8.abrupt("return", {
                  '@type': 'error',
                  '@extra': query['@extra'],
                  code: 400,
                  message: _context8.t0
                });

              case 18:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8, this, [[0, 15]]);
      }));

      function readFile(_x8) {
        return _readFile2.apply(this, arguments);
      }

      return readFile;
    }()
  }, {
    key: "deleteFile",
    value: function deleteFile(query) {
      var res = {
        '@type': 'ok',
        '@extra': query['@extra']
      };

      try {
        if (!this.isInited) {
          throw new Error('FileManager is not inited');
        }

        var info = this.cache.get(query.file_id);

        if (!info) {
          throw new Error('File is not loaded');
        }

        var idb_key = this.doDelete(info);

        if (idb_key) {
          res.idb_key = idb_key;
        }
      } catch (e) {}

      return res;
    }
  }]);

  return FileManager;
}();

/* harmony default export */ var src = __webpack_exports__["default"] = (src_TdClient);

/***/ })
/******/ ]);
});