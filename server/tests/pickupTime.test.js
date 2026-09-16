import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculatePickupMinutes } from '../controllers/orderController.js';

describe('Pickup Time Calculation Verification', () => {
  const testCases = [
    { items: 1, expected: 15 },
    { items: 3, expected: 15 },
    { items: 6, expected: 15 },
    { items: 7, expected: 25 },
    { items: 9, expected: 25 },
    { items: 10, expected: 25 },
    { items: 11, expected: 35 },
    { items: 14, expected: 35 },
    { items: 15, expected: 35 },
    { items: 16, expected: 45 },
    { items: 19, expected: 45 },
    { items: 20, expected: 45 },
    { items: 21, expected: 60 },
    { items: 25, expected: 60 },
    { items: 30, expected: 60 },
    { items: 31, expected: 75 },
    { items: 35, expected: 75 },
    { items: 40, expected: 75 },
    { items: 41, expected: 90 },
    { items: 45, expected: 90 },
    { items: 50, expected: 90 },
    { items: 51, expected: 105 },
    { items: 65, expected: 105 },
    { items: 75, expected: 105 },
    { items: 76, expected: 120 },
    { items: 90, expected: 120 },
    { items: 100, expected: 120 },
    { items: 101, expected: 150 },
    { items: 250, expected: 150 },
  ];

  for (const { items, expected } of testCases) {
    test(`correctly calculates ${items} items -> ${expected} minutes`, () => {
      const result = calculatePickupMinutes(items);
      assert.strictEqual(result, expected, `Failed for ${items} items: expected ${expected}, got ${result}`);
    });
  }
});
