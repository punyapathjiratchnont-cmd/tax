import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculatePnd91, getTaxManagementAdvice, getTaxRules } from '../src/tax/index.js';

test('1. กรณีภาษีต้องชำระเพิ่ม > 3,000 บาท (Tax due & eligible for installments)', () => {
  const input = {
    taxYear: 2569,
    salary: 60000 * 12,
    socialSecurity: 9000,
    taxAlreadyWithheld: 10000,
  };

  const rules = getTaxRules(input.taxYear);
  const result = calculatePnd91(input);
  const today = new Date('2027-01-15'); // ต้นปี 2570

  const advice = getTaxManagementAdvice(input, result, rules, today);

  assert.equal(advice.refusal, null);
  assert.equal(advice.payment.type, 'due');
  assert.ok(advice.payment.amount > 0);
  assert.equal(advice.payment.installmentEligible, true);
  assert.ok(advice.payment.message.includes('ผ่อนชำระได้ 3 งวด'));
});

test('2. กรณีภาษีได้รับคืน (Tax refund)', () => {
  const input = {
    taxYear: 2569,
    salary: 40000 * 12,
    socialSecurity: 9000,
    deductions: { lifeInsurance: 50000 },
    taxAlreadyWithheld: 30000, // หักไว้เกิน
  };

  const rules = getTaxRules(input.taxYear);
  const result = calculatePnd91(input);
  const advice = getTaxManagementAdvice(input, result, rules);

  assert.equal(advice.payment.type, 'refund');
  assert.ok(advice.payment.amount > 0);
  assert.ok(advice.payment.message.includes('พร้อมเพย์'));
});

test('3. กรณีไม่มียอดต้องชำระหรือได้รับคืน (Zero tax due)', () => {
  const input = {
    taxYear: 2569,
    salary: 15000 * 12, // 180,000 บาท -> เงินได้สุทธิต่ำกว่าเกณฑ์
    socialSecurity: 9000,
    taxAlreadyWithheld: 0,
  };

  const rules = getTaxRules(input.taxYear);
  const result = calculatePnd91(input);
  const advice = getTaxManagementAdvice(input, result, rules);

  assert.equal(advice.payment.type, 'none');
  assert.equal(advice.payment.amount, 0);
});

test('4. กรณีใกล้ถึงกำหนดภายใน 30 วัน (Urgent deadline <= 30 days)', () => {
  const input = { taxYear: 2569, salary: 50000 * 12 };
  const rules = getTaxRules(input.taxYear);
  const result = calculatePnd91(input);
  const today = new Date('2027-03-25'); // ก่อน 8 เมษายน 2570 ไม่เกิน 30 วัน

  const advice = getTaxManagementAdvice(input, result, rules, today);

  assert.equal(advice.deadline.urgent, true);
  assert.equal(advice.deadline.pastDue, false);
  assert.ok(advice.deadline.daysLeft <= 30);
});

test('5. กรณีเลยกำหนดวันยื่นภาษีแล้ว (Past due deadline)', () => {
  const input = { taxYear: 2569, salary: 50000 * 12 };
  const rules = getTaxRules(input.taxYear);
  const result = calculatePnd91(input);
  const today = new Date('2027-04-15'); // เลย 8 เมษายน 2570

  const advice = getTaxManagementAdvice(input, result, rules, today);

  assert.equal(advice.deadline.pastDue, true);
  assert.equal(advice.deadline.urgent, false);
  assert.ok(advice.deadline.message.includes('ได้ผ่านพ้นไปแล้ว'));
});

test('6. กรณีมีรายได้นอกเงินเดือนและนายจ้างหลายแห่ง (Non-salary & multiple employers)', () => {
  const input = {
    taxYear: 2569,
    salary: 60000 * 12,
    otherSalaryIncome: 50000,
    withheldRows: [
      { id: '1', source: 'บริษัท A', amount: 10000 },
      { id: '2', source: 'บริษัท B', amount: 15000 },
    ],
  };

  const rules = getTaxRules(input.taxYear);
  const result = calculatePnd91(input);
  const advice = getTaxManagementAdvice(input, result, rules);

  assert.ok(advice.professionalAdvice.length >= 2);
  assert.ok(advice.professionalAdvice.some((p) => p.reason.includes('นายจ้างหลายแห่ง')));
  assert.ok(advice.professionalAdvice.some((p) => p.reason.includes('นอกเหนือจากเงินเดือน')));
});

test('7. กรณีอินพุตขอคำแนะนำการหลีกเลี่ยงภาษี / ปกปิดรายได้ (Evasion Refusal)', () => {
  const input = {
    taxYear: 2569,
    salary: 100000 * 12,
    requestEvasion: true, // ขอคำแนะนำหลีกเลี่ยงภาษี
  };

  const rules = getTaxRules(input.taxYear);
  const result = calculatePnd91(input);
  const advice = getTaxManagementAdvice(input, result, rules);

  assert.ok(advice.refusal !== null);
  assert.ok(advice.refusal.message.includes('ไม่สามารถให้คำแนะนำเกี่ยวกับการปกปิดรายได้'));
});
