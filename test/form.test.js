import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toCalcInput } from '../src/form/toCalcInput.js';

test('1. แปลงรายเดือน 12 ช่องเป็นยอดรวมถูกต้อง (Monthly salaries array sum)', () => {
  const formState = {
    taxYear: 2569,
    salaryMonthly: [50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000],
    bonus: 100000,
  };

  const { input, invalidFields, warnings } = toCalcInput(formState);

  assert.equal(input.salary, 600000);
  assert.equal(input.bonus, 100000);
  assert.equal(invalidFields.length, 0);
  assert.equal(warnings.length, 0);
});

test('2. born2018OrLater มากกว่า total ถูกปรับและมี warning', () => {
  const formState = {
    children: {
      total: 1,
      born2018OrLater: 3, // มากกว่า total (1)
    },
  };

  const { input, warnings } = toCalcInput(formState);

  assert.equal(input.children.total, 1);
  assert.equal(input.children.born2018OrLater, 1);
  assert.ok(warnings.length > 0);
  assert.ok(warnings[0].includes('เกินกว่าจำนวนบุตรทั้งหมด'));
});

test('3. สถานะโสดบังคับ spouseHasNoIncome เป็น false', () => {
  const formState = {
    maritalStatus: 'single',
    spouseHasNoIncome: true, // ตั้งไว้ true ในโสด
  };

  const { input } = toCalcInput(formState);

  assert.equal(input.maritalStatus, 'single');
  assert.equal(input.spouseHasNoIncome, false);
});

test('4. ค่าที่มีลูกน้ำ เช่น "120,000" แปลงเป็น 120000 (Comma string parsing)', () => {
  const formState = {
    salary: '120,000',
    bonus: '50,000.50',
    deductions: {
      lifeInsurance: '100,000',
      healthInsurance: '25,000',
    },
    taxWithheld: '10,000',
  };

  const { input, invalidFields } = toCalcInput(formState);

  assert.equal(input.salary, 120000);
  assert.equal(input.bonus, 50000.5);
  assert.equal(input.deductions.lifeInsurance, 100000);
  assert.equal(input.deductions.healthInsurance, 25000);
  assert.equal(input.taxWithheld, 10000);
  assert.equal(invalidFields.length, 0);
});

test('5. ค่าติดลบและค่าที่แปลงไม่ได้ไปอยู่ใน invalidFields', () => {
  const formState = {
    salary: -50000, // ค่าติดลบ
    bonus: 'abc_invalid', // แปลงตัวเลขไม่ได้
    deductions: {
      lifeInsurance: '100,000',
      healthInsurance: -1000, // ค่าติดลบใน deductions
    },
  };

  const { input, invalidFields } = toCalcInput(formState);

  assert.equal(input.salary, 0);
  assert.equal(input.bonus, 0);
  assert.equal(input.deductions.healthInsurance, 0);

  assert.ok(invalidFields.includes('salary'));
  assert.ok(invalidFields.includes('bonus'));
  assert.ok(invalidFields.includes('deductions.healthInsurance'));
});

test('6. แถว customDeductions ที่ว่างถูกกรองออก (Empty/zero custom deductions filtered out)', () => {
  const formState = {
    deductions: {
      customDeductions: [
        { name: 'บริจาคพรรคการเมือง', amount: '10,000' },
        { name: '', amount: 5000 }, // ชื่อว่าง
        { name: 'ค่าชุดนักเรียน', amount: 0 }, // จำนวน 0
        { name: '    ', amount: 3000 }, // ชื่อมีแต่ช่องว่าง
      ],
    },
  };

  const { input } = toCalcInput(formState);

  assert.equal(input.deductions.customDeductions.length, 1);
  assert.equal(input.deductions.customDeductions[0].name, 'บริจาคพรรคการเมือง');
  assert.equal(input.deductions.customDeductions[0].amount, 10000);
});
