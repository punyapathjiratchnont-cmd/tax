import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { renderResult } from '../src/results/render.js';

// Mock DOM environment if window/document is undefined
if (typeof window === 'undefined' || typeof document === 'undefined') {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
}

test('1. เรนเดอร์ผลลัพธ์กรณี amountDue บวก ลบ และศูนย์ แสดงป้ายและตัวเลขถูกต้อง', () => {
  // Case A: amountDue > 0 (ต้องชำระเพิ่ม)
  const resPositive = {
    amountDue: 15500.5,
    grossIncome: 600000,
    expenseDeduction: 100000,
    totalAllowances: 60000,
    netIncome: 440000,
    taxCalculated: 21500,
    taxWithheld: 5999.5,
  };
  const elemPos = renderResult(resPositive);
  assert.ok(elemPos.querySelector('.hero-badge').textContent.includes('ต้องชำระเพิ่ม'));
  assert.ok(elemPos.querySelector('.hero-amount').textContent.includes('15,500.50'));

  // Case B: amountDue < 0 (ได้รับคืน)
  const resNegative = {
    amountDue: -12000,
    grossIncome: 400000,
  };
  const elemNeg = renderResult(resNegative);
  assert.ok(elemNeg.querySelector('.hero-badge').textContent.includes('ได้รับคืน'));
  assert.ok(elemNeg.querySelector('.hero-amount').textContent.includes('12,000.00')); // แสดงค่าสัมบูรณ์

  // Case C: amountDue === 0 (ไม่มียอดต้องชำระ)
  const resZero = {
    amountDue: 0,
    grossIncome: 200000,
  };
  const elemZero = renderResult(resZero);
  assert.ok(elemZero.querySelector('.hero-badge').textContent.includes('ไม่มียอดต้องชำระ'));
});

test('2. ทดสอบว่าปุ่มแก้ไขและคำนวณใหม่ทำงานถูกต้อง', () => {
  let editCalled = false;
  let recalcCalled = false;

  const elem = renderResult(
    { amountDue: 5000 },
    {
      onEdit: () => {
        editCalled = true;
      },
      onRecalculate: () => {
        recalcCalled = true;
      },
    }
  );

  const btnEdit = elem.querySelector('.btn-action-secondary');
  const btnRecalc = elem.querySelector('.btn-action-primary');

  btnEdit.click();
  btnRecalc.click();

  assert.equal(editCalled, true);
  assert.equal(recalcCalled, true);
});
