import test from 'node:test';
import assert from 'node:assert/strict';
import { fromMinorUnits, toMinorUnits } from './money.js';

test('money helpers convert between major and minor units without floating-point drift', () => {
  assert.equal(toMinorUnits(125000.45), 12500045);
  assert.equal(toMinorUnits(0.1 + 0.2), 30);
  assert.equal(fromMinorUnits(12500045), 125000.45);
});

test('money helper rejects non-finite values', () => {
  assert.throws(() => toMinorUnits(Number.NaN), /finite number/);
});
