import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { TaxWizard } from '../src/form/wizard.js';

// Setup DOM environment for tests
if (typeof window === 'undefined' || typeof document === 'undefined') {
  const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
}

test('1. ทดสอบโครงสร้างเริ่มต้นและการสลับขั้นของ TaxWizard', () => {
  const mockContainer = document.createElement('div');
  const wizard = new TaxWizard(mockContainer);

  assert.equal(wizard.currentStep, 1);
  assert.equal(wizard.totalSteps, 6);

  wizard.nextStep();
  assert.equal(wizard.currentStep, 2);

  wizard.prevStep();
  assert.equal(wizard.currentStep, 1);

  wizard.goToStep(5);
  assert.equal(wizard.currentStep, 5);
});

test('2. ทดสอบว่าเมื่อ invalidFields ไม่ว่าง ปุ่มคำนวณไม่เรียก calculateTax', () => {
  const mockContainer = document.createElement('div');
  const wizard = new TaxWizard(mockContainer);

  // ใส่ข้อมูลที่เป็นตัวเลขติดลบลงใน state
  wizard.state.salaryYearly = -50000;
  wizard.state.bonus = 'invalid_number';

  wizard.calculate();

  assert.equal(wizard.calculationResult, null);
  assert.ok(wizard.validationErrors.length > 0);
  assert.ok(wizard.validationErrors.some((e) => e.includes('salary') || e.includes('bonus')));
});

test('3. ทดสอบการคำนวณและเรนเดอร์เมื่อข้อมูลถูกต้องสมบูรณ์', () => {
  const mockContainer = document.createElement('div');
  const wizard = new TaxWizard(mockContainer);
  wizard.state.salaryYearly = 600000;
  wizard.state.bonus = 100000;
  wizard.state.socialSecurity = 9000;
  wizard.state.taxYear = 2569;

  wizard.calculate();

  assert.ok(wizard.calculationResult !== null);
  assert.equal(wizard.calculationResult.grossIncome, 700000);
  assert.equal(wizard.validationErrors.length, 0);

  // ตรวจสอบว่าเปลี่ยนสถานะไปแสดงผลลัพธ์ผ่าน renderResult แล้ว
  assert.equal(wizard.isShowingResults, true);
  assert.ok(mockContainer.querySelector('.hero-card') !== null);
});
