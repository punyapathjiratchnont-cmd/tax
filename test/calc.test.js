import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateTax } from '../src/calc/calculateTax.js';

test('1. โสดมีเงินเดือนอย่างเดียว (Single, salary only)', () => {
  const result = calculateTax({
    taxYear: 2569,
    salary: 600000,
    bonus: 0,
    maritalStatus: 'single',
    taxWithheld: 10000,
  });

  assert.equal(result.grossIncome, 600000);
  assert.equal(result.taxableIncome, 600000);
  assert.equal(result.expenseDeduction, 100000); // 50% max 100,000
  assert.equal(result.totalAllowances, 60000); // personal allowance
  assert.equal(result.netIncome, 440000); // 600k - 100k - 60k = 440k
  // Tax bracket: 0-150k @ 0% = 0; 150k-300k @ 5% = 7500; 300k-440k @ 10% = 14000. Total tax = 21500
  assert.equal(result.taxCalculated, 21500);
  assert.equal(result.taxWithheld, 10000);
  assert.equal(result.amountDue, 11500);
});

test('2. สมรส คู่สมรสไม่มีเงินได้ มีบุตร 2 คน (1 คนเกิดปี 2561 ขึ้นไป)', () => {
  const result = calculateTax({
    taxYear: 2569,
    salary: 500000,
    maritalStatus: 'married',
    spouseHasNoIncome: true,
    children: {
      total: 2,
      born2018OrLater: 1,
    },
  });

  assert.equal(result.grossIncome, 500000);
  assert.equal(result.expenseDeduction, 100000);
  // Allowances: Personal (60k) + Spouse (60k) + Children (30k + 60k = 90k) = 210,000
  assert.equal(result.totalAllowances, 210000);
  assert.equal(result.netIncome, 190000); // 500k - 100k - 210k = 190k
});

test('3. ลดหย่อนเกินเพดาน RMF และประกันชีวิต ต้องถูกตัดและมี warning', () => {
  const result = calculateTax({
    taxYear: 2569,
    salary: 400000,
    deductions: {
      lifeInsurance: 150000, // max 100k
      healthInsurance: 30000, // max 25k (life + health max 100k)
      rmf: 200000, // 30% of 400k = 120k max
    },
  });

  assert.ok(result.warnings.length > 0);
  assert.ok(result.warnings.some((w) => eIncludes(w, 'ประกันชีวิต') || eIncludes(w, 'ประกันสุขภาพ')));
  assert.ok(result.warnings.some((w) => eIncludes(w, 'RMF')));

  const rmfItem = result.deductionBreakdown.find((d) => d.id === 'rmf');
  assert.equal(rmfItem.applied, 120000); // 30% of 400,000 = 120,000
});

test('4. ภาษีที่หักไว้มากกว่าภาษีที่คำนวณได้ amountDue ต้องติดลบ', () => {
  const result = calculateTax({
    taxYear: 2569,
    salary: 300000,
    taxWithheld: 15000,
  });

  // Gross 300k - Expense 100k - Personal 60k = Net 140k (Tax = 0)
  assert.equal(result.taxCalculated, 0);
  assert.equal(result.taxWithheld, 15000);
  assert.equal(result.amountDue, -15000);
  assert.ok(result.warnings.some((w) => eIncludes(w, 'มีสิทธิ์ขอคืนภาษี')));
});

test('5. เงินได้ต่ำจนไม่ต้องเสียภาษี taxCalculated ต้องเป็น 0', () => {
  const result = calculateTax({
    taxYear: 2569,
    salary: 200000,
  });

  // Net income 200k - 100k - 60k = 40k <= 150k threshold
  assert.equal(result.taxCalculated, 0);
  assert.equal(result.amountDue, 0);
});

test('6. ค่าลบในช่องเงินต้อง throw error', () => {
  assert.throws(
    () => {
      calculateTax({
        taxYear: 2569,
        salary: -50000,
      });
    },
    (err) => eIncludes(err.message, 'salary') && eIncludes(err.message, 'ต้องไม่ติดลบ')
  );

  assert.throws(
    () => {
      calculateTax({
        taxYear: 2569,
        salary: 300000,
        socialSecurity: -500,
      });
    },
    (err) => eIncludes(err.message, 'socialSecurity') && eIncludes(err.message, 'ต้องไม่ติดลบ')
  );
});

test('7. ปีที่ไม่มีกฎต้อง throw error ภาษาไทย', () => {
  assert.throws(
    () => {
      calculateTax({
        taxYear: 2500,
        salary: 300000,
      });
    },
    (err) => eIncludes(err.message, 'ไม่มีข้อมูลกฎภาษีของปี 2500')
  );
});

function eIncludes(str, searchStr) {
  return typeof str === 'string' && str.includes(searchStr);
}
