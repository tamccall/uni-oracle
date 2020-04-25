const BigNumber = require('bignumber.js');

function Ewma(halfLifeMs, initialValue) {
  this._decay = halfLifeMs;
  this._ewma = initialValue || 0;
  this._clock = Date;
  this._stamp = (typeof initialValue === 'number') ? this._clock.now() : 0;
}

module.exports = Ewma;

Ewma.prototype.insert = function insert(x) {
  const self = this;
  const now = self._clock.now();
  const elapsed = (now - self._stamp) / (60*1000);
  self._stamp = now;

  // This seemingly magic equation is derived from the fact that we are
  // defining a half life for each value. A half life is the amount of time
  // that it takes for a value V to decay to .5V or V/2. Elapsed is the time
  // delta between this value being reported and the previous value being
  // reported. Given the half life, and the amount of time since the last
  // reported value, this equation determines how much the new value should
  // be represented in the ewma.
  // For a detailed proof read:
  // A Framework for the Analysis of Unevenly Spaced Time Series Data
  // Eckner, 2014
  const w = new BigNumber(Math.pow(2, -elapsed / self._decay));
  const lhs = w.times(self._ewma);
  const rhs = new BigNumber(1).minus(w).times(x);
  self._ewma = lhs.plus(rhs)
};


Ewma.prototype.value = function value() {
  const self = this;
  return self._ewma;
};
