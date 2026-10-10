import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getRules, availableYears, validateRules, registerTaxRules } from '../src/tax/rules/index.js';

test('1. ทดสอบว่า getRules(2569) คืนโครงสร้างครบถ้วนทุกฟิลด์', () => {
  const rules = getRules(2569);

  assert.equal(rules.taxYear, 2569);
  assert.ok(rules.source);
  assert.equal(rules.verifiedAt, null);
  assert.ok(Array.isArray(rules.brackets));
  assert.equal(rules.brackets.length, 8);

  assert.ok(rules.expenseDeduction);
  assert.equal(rules.expenseDeduction.rate, 0.5);
  assert.equal(rules.expenseDeduction.max, 100000);

  assert.equal(rules.personalAllowance, 60000);
  assert.equal(rules.spouseAllowance, 60000);
  assert.equal(rules.childAllowance, 30000);
  assert.equal(rules.childBirth2018Allowance, 30000);
  assert.equal(rules.parentAllowance, 30000);
  assert.equal(rules.disabledAllowance, 60000);

  assert.ok(rules.caps);
  assert.equal(rules.caps.lifeInsurance.max, 100000);
  assert.equal(rules.caps.healthInsurance.max, 25000);
  assert.equal(rules.caps.socialSecurity.annualMax, 9000);

  assert.ok(rules.filing);
  assert.equal(rules.installmentThreshold, 3000);
  assert.equal(rules.urgentDays, 30);
});

test('2. ทดสอบว่าปีที่ไม่มีข้อมูลในระบบจะ throw error ภาษาไทย', () => {
  assert.throws(
    () => {
      getRules(2500);
    },
    (err) => {
      return err.message.includes('ไม่มีข้อมูลกฎภาษีของปี 2500');
    }
  );
});

test('3. ทดสอบว่าการแก้ไขค่าที่ได้รับกลับไม่กระทบข้อมูลต้นฉบับ (Deep Copy)', () => {
  const r1 = getRules(2569);
  r1.personalAllowance = 999999;
  r1.caps.lifeInsurance.max = 999999;
  r1.brackets[0].rate = 0.99;

  const r2 = getRules(2569);
  assert.equal(r2.personalAllowance, 60000);
  assert.equal(r2.caps.lifeInsurance.max, 100000);
  assert.equal(r2.brackets[0].rate, 0.00);
});

test('4. ทดสอบ validateRules กับข้อมูลที่ขาดฟิลด์ ค่าติดลบ หรือขั้นบันไดไม่เรียงลำดับ', () => {
  // 4.1 ขาดฟิลด์บังคับ
  const missingField = { taxYear: 2569 };
  const res1 = validateRules(missingField);
  assert.equal(res1.valid, false);
  assert.ok(res1.errors.some((e) => e.includes('ขาดฟิลด์บังคับ')));

  // 4.2 ค่าตัวเลขติดลบ
  const negativeRules = {
    taxYear: 2569,
    brackets: [{ upTo: 150000, rate: 0 }],
    expenseDeduction: { rate: 0.5, max: 100000 },
    personalAllowance: -60000, // ติดลบ
    spouseAllowance: 60000,
    childAllowance: 30000,
    childBirth2018Allowance: 30000,
    parentAllowance: 30000,
    disabledAllowance: 60000,
    caps: {},
    filing: {},
    installmentThreshold: 3000,
  };
  const res2 = validateRules(negativeRules);
  assert.equal(res2.valid, false);
  assert.ok(res2.errors.some((e) => e.includes('ต้องไม่ติดลบ')));

  // 4.3 ขั้นบันไดไม่เรียงลำดับจากน้อยไปมาก
  const unorderBrackets = {
    taxYear: 2569,
    brackets: [
      { upTo: 500000, rate: 0.10 },
      { upTo: 300000, rate: 0.05 }, // สลับลำดับ
    ],
    expenseDeduction: { rate: 0.5, max: 100000 },
    personalAllowance: 60000,
    caps: {},
    filing: {},
    installmentThreshold: 3000,
  };
  const res3 = validateRules(unorderBrackets);
  assert.equal(res3.valid, false);
  assert.ok(res3.errors.some((e) => e.includes('ต้องมีค่ามากกว่าขั้นก่อนหน้า')));
});

test('5. ทดสอบ availableYears และการลงทะเบียนปีใหม่ registerTaxRules', () => {
  const years = availableYears();
  assert.ok(years.includes(2569));

  // ลงทะเบียนปี 2570
  const custom2570 = { ...getRules(2569), taxYear: 2570 };
  registerTaxRules(2570, custom2570);

  const newRules = getRules(2570);
  assert.equal(newRules.taxYear, 2570);
});
