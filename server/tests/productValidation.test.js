import { test, describe } from 'node:test';
import assert from 'node:assert';

// Validation helper logic as used in product controller & inventory form
function validateSellingPriceVsMrp(rawSellingPrice, rawMrp) {
  const sellingPriceNum = (rawSellingPrice !== undefined && rawSellingPrice !== null && rawSellingPrice !== "") ? Number(rawSellingPrice) : undefined;
  const mrpNum = (rawMrp !== undefined && rawMrp !== null && rawMrp !== "") ? Number(rawMrp) : undefined;

  if (
    sellingPriceNum !== undefined &&
    mrpNum !== undefined &&
    Number.isFinite(sellingPriceNum) &&
    Number.isFinite(mrpNum) &&
    sellingPriceNum > mrpNum
  ) {
    return "Selling price cannot be greater than MRP";
  }
  return null;
}

describe('Product Selling Price vs MRP Validation Test Suite', () => {
  test('1. sellingPrice = 95, mrp = 120 -> VALID', () => {
    assert.strictEqual(validateSellingPriceVsMrp("95", "120"), null);
    assert.strictEqual(validateSellingPriceVsMrp(95, 120), null);
  });

  test('2. sellingPrice = 120, mrp = 120 -> VALID', () => {
    assert.strictEqual(validateSellingPriceVsMrp("120", "120"), null);
    assert.strictEqual(validateSellingPriceVsMrp(120, 120), null);
  });

  test('3. sellingPrice = 121, mrp = 120 -> INVALID', () => {
    assert.strictEqual(validateSellingPriceVsMrp("121", "120"), "Selling price cannot be greater than MRP");
    assert.strictEqual(validateSellingPriceVsMrp(121, 120), "Selling price cannot be greater than MRP");
  });

  test('4. sellingPrice = 9, mrp = 10 -> VALID', () => {
    assert.strictEqual(validateSellingPriceVsMrp("9", "10"), null);
    assert.strictEqual(validateSellingPriceVsMrp(9, 10), null);
  });

  test('5. sellingPrice = 99, mrp = 100 -> VALID', () => {
    assert.strictEqual(validateSellingPriceVsMrp("99", "100"), null);
    assert.strictEqual(validateSellingPriceVsMrp(99, 100), null);
  });

  test('6. sellingPrice = 100, mrp = 99 -> INVALID', () => {
    assert.strictEqual(validateSellingPriceVsMrp("100", "99"), "Selling price cannot be greater than MRP");
    assert.strictEqual(validateSellingPriceVsMrp(100, 99), "Selling price cannot be greater than MRP");
  });

  test('7. Empty or undefined MRP does not trigger comparison error', () => {
    assert.strictEqual(validateSellingPriceVsMrp("95", ""), null);
    assert.strictEqual(validateSellingPriceVsMrp("95", undefined), null);
    assert.strictEqual(validateSellingPriceVsMrp("95", null), null);
  });
});
