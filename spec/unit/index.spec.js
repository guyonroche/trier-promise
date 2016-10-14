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

var chai = require("chai");
var sinon = require("sinon");
var sinonChai = require("sinon-chai");
chai.use(sinonChai);
var expect = chai.expect;

var HrStopwatch = require('../utils/hr-stopwatch');
var tp = require('../../index');

var options = {
  action: function() {},
  timeout: 'number in ms',
  limit: 'number',
  until: function() {return true;},
  interval: ['number', function() {}],
  sleep: ['number', function() {}]
};

function delay(timeout) {
  return new Promise(function(resolve) {
    setTimeout(resolve, timeout);
  });
}

describe('trier', function() {
  var sandbox, stopwatch;
  beforeEach(function() {
    sandbox = sinon.sandbox.create();
    stopwatch = new HrStopwatch();
  });
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('success', function() {
    it('first time lucky', function() {
      var action = sinon.stub().returns(Promise.resolve('value'));
      stopwatch.start();
      return tp({
          action: action,
          timeout: 1000,
          interval: 500
        })
        .then(function(value) {
          var elapsed = stopwatch.ms;
          expect(value).to.equal('value');
          expect(elapsed).to.be.lessThan(50);
          expect(action).to.have.been.calledOnce;
        });
    });
    it('third time lucky', function() {
      var count = 3;
      var action = sinon.spy(function() {
        return --count ? Promise.reject(new Error('boo')) : Promise.resolve('value');
      });
      stopwatch.start();
      return tp({
          action: action,
          timeout: 1000,
          interval: 10
        })
        .then(function(value) {
          var elapsed = stopwatch.ms;
          expect(value).to.equal('value');
          expect(elapsed).to.be.greaterThan(15);
          expect(elapsed).to.be.lessThan(35);
          expect(action).to.have.been.calledThrice;
        });
    });
    it('sync', function() {
      var action = sinon.stub().returns('value');
      stopwatch.start();
      return tp({
          action: action,
          timeout: 1000,
          interval: 500
        })
        .then(function(value) {
          var elapsed = stopwatch.ms;
          expect(value).to.equal('value');
          expect(elapsed).to.be.lessThan(50);
          expect(action).to.have.been.calledOnce;
        });
    });

    describe('sleep', function() {
      it('used', function () {
        stopwatch.start();
        var count = 2;
        var laps = [];
        var action = sinon.spy(function () {
          laps.push(stopwatch.ms);
          return delay(30)
            .then(function () {
              if (--count) {
                throw new Error('foo');
              } else {
                return 'value';
              }
            });
        });
        return tp({
            action: action,
            interval: 10,
            sleep: 20
          })
          .then(function (value) {
            laps.push(stopwatch.ms);
            expect(value).to.equal('value');
            expect(laps.length).to.equal(3);
            expect(action).to.have.been.calledTwice;
            expect(laps[0]).to.be.lessThan(5);
            expect(laps[1]).to.be.within(45, 65);
            expect(laps[2]).to.be.within(75, 95);
          })
      });
      it('not used', function () {
        stopwatch.start();
        var count = 3;
        var laps = [];
        var action = sinon.spy(function () {
          laps.push(stopwatch.ms);
          return delay(10)
            .then(function () {
              if (--count) {
                throw new Error('foo');
              } else {
                return 'value';
              }
            });
        });
        return tp({
            action: action,
            interval: 30,
            sleep: 10
          })
          .then(function (value) {
            laps.push(stopwatch.ms);
            expect(value).to.equal('value');
            expect(laps.length).to.equal(4);
            expect(action).to.have.been.calledThrice;
            expect(laps[0]).to.be.lessThan(5);
            expect(laps[1]).to.be.within(25, 45);
            expect(laps[2]).to.be.within(55, 75);
            expect(laps[3]).to.be.within(65, 85);
          })
      });
    });

    it('long promise', function() {
      stopwatch.start();
      var count = 3;
      var laps = [];
      var action = sinon.spy(function() {
        laps.push(stopwatch.ms);
        return delay(30)
          .then(function() {
            if (--count) {
              throw new Error('foo');
            } else {
              return 'value';
            }
          });
      });
      return tp({
          action: action,
          interval: 10
        })
        .then(function(value) {
          laps.push(stopwatch.ms);
          expect(value).to.equal('value');
          expect(laps.length).to.equal(4);
          expect(action).to.have.been.calledThrice;
          expect(laps[0]).to.be.lessThan(5);
          expect(laps[1]).to.be.within(25,45);
          expect(laps[2]).to.be.within(55,75);
          expect(laps[3]).to.be.within(85,105);
        })
    });

    it('variable interval', function() {
      stopwatch.start();
      var count = 10;
      var laps = [];
      var action = sinon.spy(function() {
        laps.push(stopwatch.ms);
        if (--count) {
          throw new Error('foo');
        } else {
          return 'value';
        }
      });
      return tp({
          action: action,
          interval: function() { return (10-count)*10; } // 10ms, 20ms, 30ms, ...
        })
        .then(function(value) {
          laps.push(stopwatch.ms);
          expect(value).to.equal('value');
          expect(laps.length).to.equal(11);
          expect(laps[0]).to.be.lessThan(5);
          expect(laps[1]).to.be.within(5,25);
          expect(laps[2]).to.be.within(25,45);
          expect(laps[3]).to.be.within(55,75);
          expect(laps[4]).to.be.within(95,115);
          expect(laps[5]).to.be.within(145,165);
          expect(laps[6]).to.be.within(205,225);
          expect(laps[7]).to.be.within(275,295);
          expect(laps[8]).to.be.within(355,375);
          expect(laps[9]).to.be.within(445,465);
          expect(laps[10]).to.be.within(445,465); // the successful iteration
        })
    });

    describe('async', function() {
      it('empty callback', function() {
        var action = sinon.spy(function(callback) {
          setTimeout(callback, 20);
        });
        stopwatch.start();
        return tp({
            action: action,
            timeout: 1000,
            interval: 500,
            async: true
          })
          .then(function(value) {
            var elapsed = stopwatch.ms;
            expect(value).to.deep.equal([]);
            expect(elapsed).to.be.within(15, 35);
            expect(action).to.have.been.calledOnce;
          });
      });
      it('true callback', function() {
        // like fs.exists
        var action = sinon.spy(function(callback) {
          setTimeout(function() { callback(true); }, 20);
        });
        stopwatch.start();
        return tp({
            action: action,
            timeout: 1000,
            interval: 500,
            async: true
          })
          .then(function(value) {
            var elapsed = stopwatch.ms;
            expect(value).to.deep.equal([true]);
            expect(elapsed).to.be.within(15, 35);
            expect(action).to.have.been.calledOnce;
          });
      });
      it('std callback', function() {
        // like fs.exists
        var action = sinon.spy(function(callback) {
          setTimeout(function() { callback(undefined, true); }, 20);
        });
        stopwatch.start();
        return tp({
            action: action,
            timeout: 1000,
            interval: 500,
            async: true
          })
          .then(function(value) {
            var elapsed = stopwatch.ms;
            expect(value).to.deep.equal([true]);
            expect(elapsed).to.be.within(15, 35);
            expect(action).to.have.been.calledOnce;
          });
      });
    });
  });
  describe('fail', function() {
    it('timeout', function() {
      var action = sinon.stub().returns(Promise.reject(new Error('boo')));
      stopwatch.start();
      return tp({
          action: action,
          timeout: 60,
          interval: 10
        })
        .then(function(value) {
          // shouldn't be here
          expect(false).to.be.true;
        })
        .catch(function(error) {
          var elapsed = stopwatch.ms;
          expect(error.message).to.equal('TIMEOUT');
          expect(elapsed).to.be.within(55, 75);
        });
    });
    it('until', function() {
      var action = sinon.stub().returns(Promise.reject(new Error('boo')));
      stopwatch.start();
      return tp({
          action: action,
          timeout: 1000,
          interval: 10,
          until: function() {
            return stopwatch.ms > 50;
          }
        })
        .then(function(value) {
          // shouldn't be here
          expect(false).to.be.true;
        })
        .catch(function(error) {
          var elapsed = stopwatch.ms;
          expect(error.message).to.equal('UNTIL');
          expect(elapsed).to.be.within(45, 65);
        });
    });
    it('limit', function() {
      var action = sinon.stub().returns(Promise.reject(new Error('boo')));
      stopwatch.start();
      return tp({
          action: action,
          timeout: 1000,
          interval: 10,
          limit: 5
        })
        .then(function(value) {
          // shouldn't be here
          expect(false).to.be.true;
        })
        .catch(function(error) {
          var elapsed = stopwatch.ms;
          expect(error.message).to.equal('LIMIT');
          expect(elapsed).to.be.within(35, 55);
        });
    });
    it('throw', function() {
      var action = sinon.spy(function(callback) {
        throw new Error('boo');
      });
      stopwatch.start();
      return tp({
          action: action,
          timeout: 100,
          interval: 10
        })
        .then(function(value) {
          // shouldn't be here
          expect(false).to.be.true;
        })
        .catch(function(error) {
          var elapsed = stopwatch.ms;
          expect(error.message).to.equal('TIMEOUT');
          expect(elapsed).to.be.within(95, 115);
        });
    });
    describe('async', function() {
      it('std callback fail', function() {
        // like fs.exists
        var action = sinon.spy(function(callback) {
          setTimeout(function() {
            callback(new Error('boo'));
          }, 20);
        });
        stopwatch.start();
        return tp({
            action: action,
            timeout: 60,
            interval: 10,
            async: true
          })
          .then(function(value) {
            // shouldn't be here
            expect(false).to.be.true;
          })
          .catch(function(error) {
            var elapsed = stopwatch.ms;
            expect(error.message).to.equal('TIMEOUT');
            expect(elapsed).to.be.within(55, 75);
          });
      });
    });
  });
});
