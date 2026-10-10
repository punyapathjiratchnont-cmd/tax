import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculatePnd91, getDeductionAdvice, getTaxRules } from '../src/tax/index.js';

test('1. กรณีมีสิทธิ์ลดหย่อนเหลือหลายรายการ (Multiple remaining caps)', () => {
  const input = {
    taxYear: 2569,
    salary: 80000 * 12, // 960,000 บาท
    maritalStatus: 'single',
    socialSecurity: 9000,
    deductions: {
      lifeInsurance: 30000, // เพดาน 100k -> เหลือ 70k
      rmf: 20000, // เพดานเหลือ
      homeLoanInterest: 20000, // เพดาน 100k -> เหลือ 80k
    },
    taxAlreadyWithheld: 30000,
  };

  const rules = getTaxRules(input.taxYear);
  const result = calculatePnd91(input);
  const advice = getDeductionAdvice(input, result, rules);

  assert.ok(Array.isArray(advice.adviceList));
  assert.ok(advice.adviceList.length > 0);

  // ตรวจสอบโครงสร้างของ advice item
  const item = advice.adviceList[0];
  assert.ok(item.id);
  assert.ok(item.label);
  assert.ok(typeof item.remainingCap === 'number');
  assert.ok(Array.isArray(item.scenarios));
  assert.ok(item.conditionNote);
  assert.ok(typeof item.priority === 'number');

  // ตรวจสอบการจำลองเงินลงทุนประหยัดภาษี (scenario)
  const firstScenario = item.scenarios[0];
  assert.ok(typeof firstScenario.amount === 'number');
  assert.ok(typeof firstScenario.taxSaved === 'number');
});

test('2. กรณีใช้สิทธิ์ลดหย่อนเต็มเพดานครบแล้ว (All caps fully used)', () => {
  const input = {
    taxYear: 2569,
    salary: 30000 * 12, // 360,000 บาท
    maritalStatus: 'single',
    socialSecurity: 9000,
    deductions: {
      lifeInsurance: 100000,
      healthInsurance: 25000,
      rmf: 108000,
      homeLoanInterest: 100000,
    },
  };

  const rules = getTaxRules(input.taxYear);
  const result = calculatePnd91(input);
  const advice = getDeductionAdvice(input, result, rules);

  // ควรแจ้งข้อความว่าใช้สิทธิ์ครบแล้ว หรือไม่มีภาระภาษีเพิ่ม
  assert.ok(advice.message.includes('ครบแล้ว') || advice.message.includes('ไม่มีภาระภาษี'));
});

test('3. กรณีเกินเพดานรวมกลุ่มเกษียณและประกันภัย (Over-cap group warning)', () => {
  const input = {
    taxYear: 2569,
    salary: 100000 * 12, // 1,200,000 บาท
    providentFund: 200000,
    deductions: {
      lifeInsurance: 90000,
      healthInsurance: 25000, // รวมเกิน 100,000
      rmf: 350000, // รวมกลุ่มเกษียณ > 500,000
    },
  };

  const rules = getTaxRules(input.taxYear);
  const result = calculatePnd91(input);
  const advice = getDeductionAdvice(input, result, rules);

  // ต้องแจ้งข้อความเตือนการเกินเพดานรวม
  assert.ok(advice.warnings.length > 0);
  assert.ok(advice.warnings.some((w) => w.includes('เกินเพดานรวม')));
});
