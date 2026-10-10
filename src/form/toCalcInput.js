/**
 * แปลงค่าที่ส่งเข้ามาเป็นตัวเลข และตรวจหาค่าที่แปลงไม่ได้หรือติดลบ
 * @param {any} val - ค่าที่ต้องการแปลง
 * @param {string} fieldName - ชื่อฟิลด์สำหรับบันทึกกรณีเกิด error
 * @param {string[]} invalidFields - อาร์เรย์สำหรับเก็บชื่อฟิลด์ที่ไม่ถูกต้อง
 * @returns {number} ค่าตัวเลขที่ไม่ติดลบ (ถ้าไม่ถูกต้องคืนค่า 0)
 */
function parseAmount(val, fieldName, invalidFields) {
  if (val === undefined || val === null || val === '') {
    return 0;
  }

  let num;
  if (typeof val === 'number') {
    num = val;
  } else if (typeof val === 'string') {
    const cleaned = val.replace(/,/g, '').trim();
    if (cleaned === '') return 0;
    num = Number(cleaned);
  } else {
    num = NaN;
  }

  if (isNaN(num) || num < 0) {
    if (fieldName && !invalidFields.includes(fieldName)) {
      invalidFields.push(fieldName);
    }
    return 0;
  }

  return num;
}

/**
 * แปลง state ของฟอร์มให้อยู่ในรูปแบบ input สำหรับ calculateTax
 * @param {object} formState - ข้อมูลจากฟอร์ม wizard
 * @returns {object} { input, invalidFields, warnings }
 */
export function toCalcInput(formState = {}) {
  const state = formState || {};
  const invalidFields = [];
  const warnings = [];

  // 1. ปีภาษี
  const taxYear = parseAmount(state.taxYear || 2569, 'taxYear', invalidFields) || 2569;

  // 2. รายได้เงินเดือน / โบนัส / เงินได้อื่น / เงินได้ยกเว้น
  let salary = 0;
  const isMonthlyMode = state.salaryMode === 'monthly';
  const isYearlyMode = state.salaryMode === 'yearly';
  const monthlyArr = (Array.isArray(state.salaryMonthly) && state.salaryMonthly.length > 0)
    ? state.salaryMonthly
    : ((Array.isArray(state.monthlySalaries) && state.monthlySalaries.length > 0) ? state.monthlySalaries : null);

  if (isMonthlyMode || (!isYearlyMode && monthlyArr)) {
    const arrKey = Array.isArray(state.salaryMonthly) && state.salaryMonthly.length > 0 ? 'salaryMonthly' : 'monthlySalaries';
    salary = monthlyArr.reduce((sum, item, idx) => {
      return sum + parseAmount(item, `${arrKey}[${idx}]`, invalidFields);
    }, 0);
  } else {
    const salaryVal = state.salary !== undefined ? state.salary : state.salaryYearly;
    salary = parseAmount(salaryVal, 'salary', invalidFields);
  }

  const bonus = parseAmount(state.bonus, 'bonus', invalidFields);
  const otherSalaryIncome = parseAmount(state.otherSalaryIncome, 'otherSalaryIncome', invalidFields);
  const exemptIncome = parseAmount(state.exemptIncome, 'exemptIncome', invalidFields);

  // 3. กองทุนและประกันสังคม
  const socialSecurity = parseAmount(state.socialSecurity, 'socialSecurity', invalidFields);
  const providentFund = parseAmount(state.providentFund, 'providentFund', invalidFields);
  const otherFunds = parseAmount(state.otherFunds, 'otherFunds', invalidFields);

  // 4. สถานะภาพและการดูแลครอบครัว
  const maritalStatus = state.maritalStatus === 'married' ? 'married' : 'single';
  let spouseHasNoIncome = false;
  if (maritalStatus === 'single') {
    spouseHasNoIncome = false;
  } else {
    spouseHasNoIncome = Boolean(state.spouseHasNoIncome);
  }

  // 5. ข้อมูลบุตร
  let rawTotal = 0;
  let rawBorn2018 = 0;

  if (typeof state.children === 'number' || typeof state.children === 'string') {
    rawTotal = parseAmount(state.children, 'children', invalidFields);
  } else if (state.children && typeof state.children === 'object') {
    if (state.children.total !== undefined) {
      rawTotal = parseAmount(state.children.total, 'children.total', invalidFields);
    } else if (state.children.general !== undefined) {
      const gen = parseAmount(state.children.general, 'children.general', invalidFields);
      const b2018 = parseAmount(
        state.children.born2018OrLater !== undefined
          ? state.children.born2018OrLater
          : state.children.born2561Onwards,
        'children.born2018OrLater',
        invalidFields
      );
      rawTotal = gen + b2018;
      rawBorn2018 = b2018;
    }

    if (state.children.born2018OrLater !== undefined) {
      rawBorn2018 = parseAmount(state.children.born2018OrLater, 'children.born2018OrLater', invalidFields);
    } else if (state.children.born2561Onwards !== undefined) {
      rawBorn2018 = parseAmount(state.children.born2561Onwards, 'children.born2561Onwards', invalidFields);
    }
  } else {
    if (state.childrenTotal !== undefined) {
      rawTotal = parseAmount(state.childrenTotal, 'childrenTotal', invalidFields);
    } else if (state.childrenGeneral !== undefined) {
      const gen = parseAmount(state.childrenGeneral, 'childrenGeneral', invalidFields);
      const b2018 = parseAmount(
        state.childrenBorn2018OrLater !== undefined
          ? state.childrenBorn2018OrLater
          : state.childrenBorn2561Onwards,
        'childrenBorn2018OrLater',
        invalidFields
      );
      rawTotal = gen + b2018;
      rawBorn2018 = b2018;
    }

    if (rawBorn2018 === 0) {
      if (state.childrenBorn2018OrLater !== undefined) {
        rawBorn2018 = parseAmount(state.childrenBorn2018OrLater, 'childrenBorn2018OrLater', invalidFields);
      } else if (state.childrenBorn2561Onwards !== undefined) {
        rawBorn2018 = parseAmount(state.childrenBorn2561Onwards, 'childrenBorn2561Onwards', invalidFields);
      }
    }
  }

  let totalChildren = rawTotal;
  let born2018OrLater = rawBorn2018;

  if (born2018OrLater > totalChildren) {
    warnings.push(
      `จำนวนบุตรที่เกิดปี 2561 ขึ้นไป (${born2018OrLater} คน) เกินกว่าจำนวนบุตรทั้งหมด (${totalChildren} คน) ระบบได้ปรับให้เท่ากับจำนวนบุตรทั้งหมด (${totalChildren} คน)`
    );
    born2018OrLater = totalChildren;
  }

  const parentsSupported = parseAmount(state.parentsSupported, 'parentsSupported', invalidFields);
  const disabledDependents = parseAmount(state.disabledDependents, 'disabledDependents', invalidFields);

  // 6. ค่าลดหย่อน
  const rawDeductions = state.deductions || {};
  const lifeInsurance = parseAmount(rawDeductions.lifeInsurance, 'deductions.lifeInsurance', invalidFields);
  const healthInsurance = parseAmount(rawDeductions.healthInsurance, 'deductions.healthInsurance', invalidFields);
  const parentHealthInsurance = parseAmount(
    rawDeductions.parentHealthInsurance,
    'deductions.parentHealthInsurance',
    invalidFields
  );
  const rmf = parseAmount(rawDeductions.rmf, 'deductions.rmf', invalidFields);
  const donationEducation = parseAmount(
    rawDeductions.donationEducation,
    'deductions.donationEducation',
    invalidFields
  );
  const donationGeneral = parseAmount(rawDeductions.donationGeneral, 'deductions.donationGeneral', invalidFields);
  const homeLoanInterest = parseAmount(
    rawDeductions.homeLoanInterest,
    'deductions.homeLoanInterest',
    invalidFields
  );

  let rawCustom = rawDeductions.customDeductions || state.customDeductions || [];
  if (!Array.isArray(rawCustom)) {
    rawCustom = [];
  }

  const customDeductions = [];
  rawCustom.forEach((item, idx) => {
    if (!item || typeof item !== 'object') return;
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    const amount = parseAmount(item.amount, `customDeductions[${idx}].amount`, invalidFields);

    if (name !== '' && amount > 0) {
      customDeductions.push({ name, amount });
    }
  });

  // 7. ภาษีที่หักไว้แล้ว
  let taxWithheld = 0;
  if (Array.isArray(state.withheldRows) && state.withheldRows.length > 0) {
    taxWithheld = state.withheldRows.reduce((sum, item, idx) => {
      const val = typeof item === 'object' && item !== null ? item.amount : item;
      return sum + parseAmount(val, `withheldRows[${idx}].amount`, invalidFields);
    }, 0);
  } else if (Array.isArray(state.taxWithheldList) && state.taxWithheldList.length > 0) {
    taxWithheld = state.taxWithheldList.reduce((sum, item, idx) => {
      const val = typeof item === 'object' && item !== null ? item.amount : item;
      return sum + parseAmount(val, `taxWithheldList[${idx}]`, invalidFields);
    }, 0);
  } else if (Array.isArray(state.taxWithheld) && state.taxWithheld.length > 0) {
    taxWithheld = state.taxWithheld.reduce((sum, item, idx) => {
      const val = typeof item === 'object' && item !== null ? item.amount : item;
      return sum + parseAmount(val, `taxWithheld[${idx}]`, invalidFields);
    }, 0);
  } else {
    const val = state.taxWithheld !== undefined ? state.taxWithheld : state.taxAlreadyWithheld;
    taxWithheld = parseAmount(val, 'taxWithheld', invalidFields);
  }

  // 8. ประกอบเป็น Input object
  const input = {
    taxYear,
    salary,
    bonus,
    otherSalaryIncome,
    exemptIncome,
    socialSecurity,
    providentFund,
    otherFunds,
    maritalStatus,
    spouseHasNoIncome,
    children: {
      total: totalChildren,
      born2018OrLater,
    },
    parentsSupported,
    disabledDependents,
    deductions: {
      lifeInsurance,
      healthInsurance,
      parentHealthInsurance,
      rmf,
      donationEducation,
      donationGeneral,
      homeLoanInterest,
      customDeductions,
    },
    taxWithheld,
  };

  return {
    input,
    invalidFields,
    warnings,
  };
}
