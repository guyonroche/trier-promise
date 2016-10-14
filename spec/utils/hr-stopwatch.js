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

var HrStopwatch = module.exports = function() {
  this.total = 0;
};

HrStopwatch.prototype = {
  start: function() {
    this.hrStart = process.hrtime();
  },

  stop: function() {
    if (this.hrStart) {
      this.total += this._span;
      delete this.hrStart;
    }
  },

  reset: function() {
    this.total = 0;
    delete this.hrStart;
  },

  get span() {
    if (this.hrStart) {
      return this.total + this._span;
    } else {
      return this.total;
    }
  },

  get _span() {
    var hrNow = process.hrtime();
    var start = this.hrStart[0] + this.hrStart[1] / 1e9;
    var finish = hrNow[0] + hrNow[1] / 1e9;
    return finish - start;
  },

  toString: function(format) {
    switch (format) {
      case "ms":
        return "" + this.ms + "ms";
      case "microseconds":
        return "" + this.microseconds + "\xB5s";
      default:
        return "" + this.span + " seconds";
    }
  },
  get ms() {
    return Math.round(this.span * 1000);
  },
  get microseconds() {
    return Math.round(this.span * 1000000);
  }
};
