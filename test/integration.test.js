import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { toCalcInput } from '../src/form/toCalcInput.js';
import { calculateTax } from '../src/calc/calculateTax.js';
import { renderResult } from '../src/results/render.js';
import { TaxWizard } from '../src/form/wizard.js';
import { registerTaxRules, getRules } from '../src/rules/index.js';

// Setup DOM environment for integration tests
if (typeof window === 'undefined' || typeof document === 'undefined') {
  const dom = new JSDOM('<!DOCTYPE html><html><body><div id="wizard-container"></div></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
}

test('Integration 1. เส้นทางปกติ: กรอกฟอร์มครบ → toCalcInput → calculateTax → renderResult', () => {
  const formState = {
    taxYear: 2569,
    maritalStatus: 'single',
    spouseHasNoIncome: false,
    childrenTotal: 0,
    childrenBorn2018OrLater: 0,
    parentsSupported: 0,
    disabledDependents: 0,
    salaryMode: 'yearly',
    salaryYearly: '600,000', // มีลูกน้ำ
    bonus: '100,000',
    otherSalaryIncome: 0,
    exemptIncome: 0,
    socialSecurity: '9,000',
    providentFund: '30,000',
    otherFunds: 0,
    deductions: {
      lifeInsurance: '50,000',
      healthInsurance: '15,000',
      parentHealthInsurance: 0,
      rmf: '20,000',
      donationEducation: 0,
      donationGeneral: 0,
      homeLoanInterest: '25,000',
      customDeductions: [],
    },
    withheldRows: [{ id: '1', source: 'นายจ้างหลัก', amount: '20,000' }],
  };

  // Step A: toCalcInput
  const { input, invalidFields, warnings } = toCalcInput(formState);
  assert.equal(invalidFields.length, 0);
  assert.equal(input.salary, 600000);
  assert.equal(input.bonus, 100000);

  // Step B: calculateTax
  const result = calculateTax(input);
  assert.equal(result.grossIncome, 700000);
  assert.equal(result.taxableIncome, 700000);
  assert.equal(result.expenseDeduction, 100000);
  // Allowances: Personal(60k) + SocSec(9k) + Life(50k)+Health(15k) + PVD(30k) + RMF(20k) + HomeLoan(25k) = 209,000
  assert.equal(result.totalAllowances, 209000);
  assert.equal(result.netIncome, 391000); // 700k - 100k - 209k = 391k
  // Tax: 0-150k (0) + 150-300k (7500) + 300-391k (9100) = 16,600
  assert.equal(result.taxCalculated, 16600);
  assert.equal(result.taxWithheld, 20000);
  assert.equal(result.amountDue, -3400); // Refund 3,400

  // Step C: renderResult
  const container = document.createElement('div');
  renderResult(result, { container, inputWarnings: warnings });
  assert.ok(container.querySelector('.hero-badge').textContent.includes('ได้รับคืน'));
  assert.ok(container.querySelector('.hero-amount').textContent.includes('3,400.00'));
});

test('Integration 2. ช่องผิด: มี invalidFields แล้วปุ่มคำนวณไม่เรียก calculateTax และแสดงรายการช่องที่ต้องแก้', () => {
  const container = document.createElement('div');
  const wizard = new TaxWizard(container);

  wizard.state.salaryMonthly = null;
  wizard.state.salaryYearly = -10000; // ค่าติดลบ
  wizard.state.bonus = 'abc'; // แปลงตัวเลขไม่ได้

  wizard.calculate();

  assert.equal(wizard.calculationResult, null);
  assert.equal(wizard.isShowingResults, false);
  assert.ok(wizard.validationErrors.length >= 2);
  assert.ok(wizard.validationErrors.some((e) => e.includes('salary')));
});

test('Integration 3. แก้ไขกลับ: ย้อนไปขั้นก่อนแล้วกลับมา ค่าเดิมยังคงอยู่', () => {
  const container = document.createElement('div');
  const wizard = new TaxWizard(container);

  wizard.state.salaryYearly = 750000;
  wizard.goToStep(2);
  assert.equal(wizard.state.salaryYearly, 750000);

  wizard.prevStep(); // กลับไป step 1
  assert.equal(wizard.currentStep, 1);

  wizard.nextStep(); // ถัดไป step 2
  assert.equal(wizard.currentStep, 2);
  assert.equal(wizard.state.salaryYearly, 750000); // ค่าเดิมยังอยู่ครบ
});

test('Integration 4. คำนวณซ้ำ: กด "คำนวณใหม่" ได้ผลลัพธ์คงเดิมเมื่อข้อมูลเดิม', () => {
  const container = document.createElement('div');
  const wizard = new TaxWizard(container);

  wizard.state.salaryYearly = 500000;
  wizard.calculate();

  const res1 = wizard.calculationResult;
  assert.ok(res1 !== null);

  wizard.calculate();
  const res2 = wizard.calculationResult;

  assert.equal(res1.netIncome, res2.netIncome);
  assert.equal(res1.amountDue, res2.amountDue);
});

test('Integration 5. เปลี่ยนปีภาษี: เมื่อมีปีอื่นในระบบ ผลคำนวณเปลี่ยนไปตามกฎของปีนั้น', () => {
  // สร้างกฎปี 2570 ทดสอบ
  const baseRules = getRules(2569);
  const rules2570 = {
    ...baseRules,
    taxYear: 2570,
    personalAllowance: 100000, // ปรับค่าลดหย่อนส่วนตัวเป็น 100,000 ในปี 2570
  };
  registerTaxRules(2570, rules2570);

  const input2569 = { taxYear: 2569, salary: 500000 };
  const input2570 = { taxYear: 2570, salary: 500000 };

  const res2569 = calculateTax(input2569);
  const res2570 = calculateTax(input2570);

  assert.equal(res2569.totalAllowances, 60000);
  assert.equal(res2570.totalAllowances, 100000);
  assert.notEqual(res2569.netIncome, res2570.netIncome);
});
