/**
 * Copyright (c) 2016 Guyon Roche
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */
'use strict';

var assign = Object.assign || function assign(target) {
  // We must check against these specific cases.
  if (target === undefined || target === null) {
    throw new TypeError('Cannot convert undefined or null to object');
  }

  var output = Object(target);
  for (var index = 1; index < arguments.length; index++) {
    var source = arguments[index];
    if (source !== undefined && source !== null) {
      for (var nextKey in source) {
        if (source.hasOwnProperty(nextKey)) {
          output[nextKey] = source[nextKey];
        }
      }
    }
  }
  return output;
}

function trier(options) {
  options = assign({}, trier.defaults, options);
  return new Promise(function(resolve, reject) {
    var action = options.action;
    var timeout = options.timeout || 0;
    var limit = options.limit;
    var until = options.until;
    var interval = options.interval;
    var sleep = options.sleep || 0;
    var async = options.async || false;

    function callAction() {
      return new Promise(function(resolve, reject) {
        var result = action(function() {
          // if we're here, it's an async function with conventional callback signature
          var error = arguments[0];
          if (error instanceof Error) {
            reject(error);
          } else {
            var args;
            if ((error === undefined) || (error === null)) {
              var args = Array.prototype.slice.call(arguments, 1);
            } else {
              var args = Array.prototype.slice.call(arguments);
            }
            resolve(args);
          }
        });
        
        // if sync function or promise returned, resolve with result
        if (!async || (result && (typeof result.then === 'function'))) {
          resolve(result);
        }
        
        // otherwise, we wait
      });
    }

    var start = Date.now();
    var end = start + timeout;
    var getTimeLeft = function() { return end - Date.now(); };
    var getTimedOut = timeout ?
      function() { return getTimeLeft() <= 0; } :
      function() { return false; };

    var getInterval = (typeof interval === 'function') ?
      function() { return interval(); } :
      function() { return interval; };
    var getSleep = (typeof sleep === 'function') ?
      function() { return sleep(); } :
      function() { return sleep; };
    var getUntil = until || function() { return false; };
    var getExpiredLimit = limit ?
      function() { return --limit <=  0; } :
      function() { return false; };
    
    function loop() {
      var loopStart = Date.now();
      callAction()
        .then(resolve, function(error) {
          if (getExpiredLimit()) {
            reject(new Error('LIMIT'));
          } else if (getUntil()) {
            reject(new Error('UNTIL'));
          } else if (getTimedOut()) {
            reject(new Error('TIMEOUT'));
          } else {
            var future = loopStart + getInterval();
            var snooze = Math.max(future - Date.now(), getSleep(), 0);
            setTimeout(function() {
              loop();
            }, snooze);
          }
        });
    }
    
    loop();
  });
};
trier.defaults = {};
trier.setDefault = function setDefault(name, value) {
  trier.defaults[name] = value;
};
trier.clearDefault = function clearDefault(name) {
  delete trier.defaults[name];
}
module.exports = trier;