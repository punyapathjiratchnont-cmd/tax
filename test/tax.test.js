import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculatePnd91, getTaxRules } from '../src/tax/index.js';

test('1. กรณีโสด เงินเดือนล้วน (Single, salary only)', () => {
  const result = calculatePnd91({
    taxYear: 2569,
    salary: 50000 * 12, // 600,000 บาท
    maritalStatus: 'single',
    socialSecurity: 9000,
    taxAlreadyWithheld: 15000,
  });

  assert.equal(result.grossIncome, 600000);
  assert.equal(result.expenseDeduction, 100000); // 50% แต่ไม่เกิน 100,000
  // ค่าลดหย่อน = ส่วนตัว (60,000) + ประกันสังคม (9,000) = 69,000
  assert.equal(result.totalAllowances, 69000);
  // เงินได้สุทธิ = 600,000 - 100,000 - 69,000 = 431,000
  assert.equal(result.netIncome, 431000);

  // คำนวณภาษี:
  // 0 - 150,000 = 0
  // 150,001 - 300,000 (150,000 @ 5%) = 7,500
  // 300,001 - 431,000 (131,000 @ 10%) = 13,100
  // รวมภาษี = 20,600
  assert.equal(result.taxCalculated, 20600);
  assert.equal(result.amountDue, 5600); // 20,600 - 15,000 = 5,600 (ต้องชำระเพิ่ม)
});

test('2. กรณีสมรส มีบุตรและคู่สมรสไม่มีรายได้ (Married with children)', () => {
  const result = calculatePnd91({
    taxYear: 2569,
    salary: 80000 * 12, // 960,000 บาท
    maritalStatus: 'married',
    spouseHasNoIncome: true,
    children: { general: 1, born2561Onwards: 1 },
    parentsSupported: 2,
    socialSecurity: 9000,
    taxAlreadyWithheld: 50000,
  });

  assert.equal(result.grossIncome, 960000);
  assert.equal(result.expenseDeduction, 100000);

  // ลดหย่อน:
  // - ส่วนตัว: 60,000
  // - คู่สมรส: 60,000
  // - บุตรทั่วไป (1 คน): 30,000
  // - บุตรเกิดปี 2561 ขึ้นไป (1 คน): 60,000
  // - บิดามารดา (2 ท่าน): 60,000
  // - ประกันสังคม: 9,000
  // รวมลดหย่อน = 279,000
  assert.equal(result.totalAllowances, 279000);
  // เงินได้สุทธิ = 960,000 - 100,000 - 279,000 = 581,000
  assert.equal(result.netIncome, 581000);
});

test('3. กรณีลดหย่อนเกินเพดาน (Deductions exceeding caps)', () => {
  const result = calculatePnd91({
    taxYear: 2569,
    salary: 100000 * 12, // 1,200,000 บาท
    socialSecurity: 15000, // เกินเพดาน 9,000
    providentFund: 250000, // เกิน 15% ของ 1.2M (180,000)
    deductions: {
      lifeInsurance: 150000, // เกินเพดาน 100,000
      healthInsurance: 30000, // เกินเพดาน 25,000
      homeLoanInterest: 120000, // เกินเพดาน 100,000
    },
  });

  // ต้องมีคำเตือนการปรับลดเพดาน
  assert.ok(result.warnings.length > 0);

  // ตรวจสอบว่าถูกตัดเพดานแล้ว
  const socItem = result.deductionBreakdown.find((i) => i.name === 'ประกันสังคม');
  assert.equal(socItem.actualAllowed, 9000);

  const homeItem = result.deductionBreakdown.find((i) => i.name === 'ดอกเบี้ยกู้ยืมเพื่อซื้อบ้าน');
  assert.equal(homeItem.actualAllowed, 100000);
});

test('4. กรณีภาษีที่หักไว้มากกว่าภาษีที่คำนวณได้ (ได้คืนภาษี)', () => {
  const result = calculatePnd91({
    taxYear: 2569,
    salary: 40000 * 12, // 480,000 บาท
    maritalStatus: 'single',
    socialSecurity: 9000,
    deductions: {
      lifeInsurance: 50000,
      rmf: 30000,
    },
    taxAlreadyWithheld: 30000, // หักไว้เยอะกว่า
  });

  // ยอดภาษีต้องเป็นค่าลบ (ได้คืน)
  assert.ok(result.amountDue < 0);
  assert.equal(result.taxWithheld, 30000);
});

test('5. กรณีเงินได้ต่ำกว่าเกณฑ์ที่ต้องเสียภาษี (Income below tax threshold)', () => {
  const result = calculatePnd91({
    taxYear: 2569,
    salary: 20000 * 12, // 240,000 บาท
    maritalStatus: 'single',
    socialSecurity: 9000,
    taxAlreadyWithheld: 0,
  });

  // เงินได้ 240,000 - 100,000 (หักค่าใช้จ่าย) - 69,000 (ลดหย่อน) = 71,000 (อยู่ในช่วงยกเว้น 0-150,000)
  assert.equal(result.netIncome, 71000);
  assert.equal(result.taxCalculated, 0);
  assert.equal(result.amountDue, 0);
});

test('6. กรณีระบุปีภาษีที่ไม่มีข้อมูลกฎ (Invalid tax year error)', () => {
  assert.throws(
    () => {
      getTaxRules(2500);
    },
    (err) => {
      return err.message.includes('ไม่พบข้อมูลกฎภาษีสำหรับปีภาษี 2500');
    }
  );
});
