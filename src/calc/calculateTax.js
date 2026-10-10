import { getRules } from '../rules/index.js';

/**
 * ปัดเศษเป็นทศนิยม 2 ตำแหน่ง
 * @param {number} val
 * @returns {number}
 */
function round2(val) {
  if (typeof val !== 'number' || isNaN(val)) return 0;
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * ตรวจสอบความถูกต้องของตัวเลขและปฏิเสธค่าติดลบ
 * @param {number} val
 * @param {string} fieldName
 */
function checkNonNegative(val, fieldName) {
  if (val !== undefined && val !== null) {
    if (typeof val !== 'number' || isNaN(val)) {
      throw new Error(`ค่า ${fieldName} ต้องเป็นตัวเลข`);
    }
    if (val < 0) {
      throw new Error(`ค่า ${fieldName} ต้องไม่ติดลบ`);
    }
  }
}

/**
 * คำนวณภาษีเงินได้บุคคลธรรมดา (ภ.ง.ด.91) สำหรับเงินเดือนประจำ
 * @param {object} input - ข้อมูลนำเข้าสำหรับคำนวณภาษี
 * @returns {object} ผลลัพธ์การคำนวณภาษีพร้อมการสรุปและรายการหักลดหย่อน
 */
export function calculateTax(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error('ข้อมูลนำเข้า (input) ต้องเป็น Object');
  }

  const taxYear = input.taxYear || 2569;

  // อ่านกฎของปีภาษี (หากไม่มีปีนั้น getRules จะ throw error ภาษาไทยออกไปตรงๆ)
  const rules = getRules(taxYear);

  // 1. ตรวจสอบค่าติดลบของทุกฟิลด์การเงิน/จำนวน
  checkNonNegative(input.salary, 'salary');
  checkNonNegative(input.bonus, 'bonus');
  checkNonNegative(input.otherSalaryIncome, 'otherSalaryIncome');
  checkNonNegative(input.exemptIncome, 'exemptIncome');
  checkNonNegative(input.socialSecurity, 'socialSecurity');
  checkNonNegative(input.providentFund, 'providentFund');
  checkNonNegative(input.otherFunds, 'otherFunds');
  checkNonNegative(input.parentsSupported, 'parentsSupported');
  checkNonNegative(input.disabledDependents, 'disabledDependents');

  const taxWithheldInput = input.taxWithheld !== undefined ? input.taxWithheld : input.taxAlreadyWithheld;
  checkNonNegative(taxWithheldInput, 'taxWithheld');

  if (typeof input.children === 'number') {
    checkNonNegative(input.children, 'children');
  } else if (input.children && typeof input.children === 'object') {
    checkNonNegative(input.children.total, 'children.total');
    checkNonNegative(input.children.general, 'children.general');
    checkNonNegative(input.children.born2018OrLater, 'children.born2018OrLater');
    checkNonNegative(input.children.born2561Onwards, 'children.born2561Onwards');
  }

  const deductions = input.deductions || {};
  checkNonNegative(deductions.lifeInsurance, 'deductions.lifeInsurance');
  checkNonNegative(deductions.healthInsurance, 'deductions.healthInsurance');
  checkNonNegative(deductions.parentHealthInsurance, 'deductions.parentHealthInsurance');
  checkNonNegative(deductions.rmf, 'deductions.rmf');
  checkNonNegative(deductions.donationEducation, 'deductions.donationEducation');
  checkNonNegative(deductions.donationGeneral, 'deductions.donationGeneral');
  checkNonNegative(deductions.homeLoanInterest, 'deductions.homeLoanInterest');

  if (Array.isArray(deductions.customDeductions)) {
    deductions.customDeductions.forEach((item, index) => {
      if (item && item.amount !== undefined) {
        checkNonNegative(item.amount, `deductions.customDeductions[${index}].amount`);
      }
    });
  }

  const warnings = [];
  const deductionBreakdown = [];

  // 2. คำนวณเงินได้พึงประเมิน
  const salary = input.salary || 0;
  const bonus = input.bonus || 0;
  const otherSalaryIncome = input.otherSalaryIncome || 0;
  const exemptIncome = input.exemptIncome || 0;

  const grossIncome = salary + bonus + otherSalaryIncome;
  const taxableIncome = Math.max(0, grossIncome - exemptIncome);

  // 3. หักค่าใช้จ่ายเหมา 50% ไม่เกินเพดานตามกฎ
  const expRate = rules.expenseDeduction.rate;
  const expMax = rules.expenseDeduction.max;
  const rawExpense = taxableIncome * expRate;
  const expenseDeduction = Math.min(rawExpense, expMax);

  if (rawExpense > expMax) {
    warnings.push(`ค่าใช้จ่ายเหมา 50% เกินเพดาน ${expMax.toLocaleString('th-TH')} บาท ถูกปรับลดตามเพดาน`);
  }

  // 4. หักค่าลดหย่อน
  // 4.1 ลดหย่อนส่วนตัว
  const personalAllow = rules.personalAllowance;
  deductionBreakdown.push({
    id: 'personal',
    label: 'ค่าลดหย่อนส่วนตัว',
    name: 'ค่าลดหย่อนส่วนตัว',
    requested: personalAllow,
    applied: personalAllow,
    remainingCap: 0,
  });

  // 4.2 คู่สมรส
  if (input.maritalStatus === 'married' && input.spouseHasNoIncome) {
    const spouseAllow = rules.spouseAllowance;
    deductionBreakdown.push({
      id: 'spouse',
      label: 'ค่าลดหย่อนคู่สมรส (ไม่มีรายได้)',
      name: 'ค่าลดหย่อนคู่สมรส (ไม่มีรายได้)',
      requested: spouseAllow,
      applied: spouseAllow,
      remainingCap: 0,
    });
  }

  // 4.3 บุตร
  let childGeneral = 0;
  let child2018Plus = 0;

  if (typeof input.children === 'number') {
    childGeneral = input.children;
  } else if (input.children && typeof input.children === 'object') {
    child2018Plus = input.children.born2018OrLater || input.children.born2561Onwards || 0;
    if (input.children.total !== undefined) {
      childGeneral = Math.max(0, input.children.total - child2018Plus);
    } else {
      childGeneral = input.children.general || 0;
    }
  }

  const totalChildCount = childGeneral + child2018Plus;
  if (totalChildCount > 0) {
    const childReq = (totalChildCount * rules.childAllowance) + (child2018Plus * rules.childBirth2018Allowance);
    deductionBreakdown.push({
      id: 'children',
      label: 'ค่าลดหย่อนบุตร',
      name: 'ค่าลดหย่อนบุตร',
      requested: childReq,
      applied: childReq,
      remainingCap: null,
    });
  }

  // 4.4 บิดามารดา
  const parentsCount = input.parentsSupported || 0;
  if (parentsCount > 0) {
    const parentReq = parentsCount * rules.parentAllowance;
    deductionBreakdown.push({
      id: 'parents',
      label: 'ค่าลดหย่อนบิดามารดา',
      name: 'ค่าลดหย่อนบิดามารดา',
      requested: parentReq,
      applied: parentReq,
      remainingCap: null,
    });
  }

  // 4.5 ผู้พิการ/ทุพพลภาพ
  const disabledCount = input.disabledDependents || 0;
  if (disabledCount > 0) {
    const disabledReq = disabledCount * rules.disabledAllowance;
    deductionBreakdown.push({
      id: 'disabled',
      label: 'ค่าลดหย่อนผู้พิการหรือทุพพลภาพ',
      name: 'ค่าลดหย่อนผู้พิการหรือทุพพลภาพ',
      requested: disabledReq,
      applied: disabledReq,
      remainingCap: null,
    });
  }

  // 4.6 ประกันสังคม
  const ssReq = input.socialSecurity || 0;
  const ssMax = rules.caps.socialSecurity.annualMax || (rules.caps.socialSecurity.monthlyMax * 12);
  const ssApplied = Math.min(ssReq, ssMax);
  if (ssReq > ssMax) {
    warnings.push(`เงินสมทบประกันสังคม (${ssReq.toLocaleString('th-TH')} บาท) เกินเพดาน ${ssMax.toLocaleString('th-TH')} บาท ถูกปรับลดตามเพดาน`);
  }
  if (ssReq > 0) {
    deductionBreakdown.push({
      id: 'socialSecurity',
      label: 'เงินสมทบประกันสังคม',
      name: 'ประกันสังคม',
      requested: ssReq,
      applied: ssApplied,
      remainingCap: Math.max(0, ssMax - ssApplied),
    });
  }

  // 4.7 ประกันสุขภาพตนเอง & ประกันชีวิต
  const healthReq = deductions.healthInsurance || 0;
  const healthCap = rules.caps.healthInsurance.max;
  const healthApplied = Math.min(healthReq, healthCap);
  if (healthReq > healthCap) {
    warnings.push(`เบี้ยประกันสุขภาพตนเอง (${healthReq.toLocaleString('th-TH')} บาท) เกินเพดาน ${healthCap.toLocaleString('th-TH')} บาท ถูกปรับลดตามเพดาน`);
  }

  const lifeReq = deductions.lifeInsurance || 0;
  const combinedInsCap = rules.caps.lifeInsurance.max;
  const combinedInsReq = lifeReq + healthApplied;
  const combinedInsApplied = Math.min(combinedInsReq, combinedInsCap);
  if (combinedInsReq > combinedInsCap) {
    warnings.push(`รวมเบี้ยประกันชีวิตและสุขภาพตนเอง (${combinedInsReq.toLocaleString('th-TH')} บาท) เกินเพดานรวม ${combinedInsCap.toLocaleString('th-TH')} บาท ถูกปรับลดตามเพดาน`);
  }

  const lifeApplied = Math.max(0, combinedInsApplied - healthApplied);

  if (lifeReq > 0) {
    deductionBreakdown.push({
      id: 'lifeInsurance',
      label: 'เบี้ยประกันชีวิต',
      name: 'เบี้ยประกันชีวิต',
      requested: lifeReq,
      applied: lifeApplied,
      remainingCap: Math.max(0, combinedInsCap - combinedInsApplied),
    });
  }

  if (healthReq > 0) {
    deductionBreakdown.push({
      id: 'healthInsurance',
      label: 'เบี้ยประกันสุขภาพตนเอง',
      name: 'เบี้ยประกันสุขภาพตนเอง',
      requested: healthReq,
      applied: healthApplied,
      remainingCap: Math.max(0, healthCap - healthApplied),
    });
  }

  // 4.8 ประกันสุขภาพบิดามารดา
  const parentHealthReq = deductions.parentHealthInsurance || 0;
  const parentHealthCap = rules.caps.parentHealthInsurance.max;
  const parentHealthApplied = Math.min(parentHealthReq, parentHealthCap);
  if (parentHealthReq > parentHealthCap) {
    warnings.push(`เบี้ยประกันสุขภาพบิดามารดา (${parentHealthReq.toLocaleString('th-TH')} บาท) เกินเพดาน ${parentHealthCap.toLocaleString('th-TH')} บาท ถูกปรับลดตามเพดาน`);
  }
  if (parentHealthReq > 0) {
    deductionBreakdown.push({
      id: 'parentHealthInsurance',
      label: 'เบี้ยประกันสุขภาพบิดามารดา',
      name: 'เบี้ยประกันสุขภาพบิดามารดา',
      requested: parentHealthReq,
      applied: parentHealthApplied,
      remainingCap: Math.max(0, parentHealthCap - parentHealthApplied),
    });
  }

  // 4.9 กองทุนเกษียณอายุ (PVD, กบข. / otherFunds, RMF)
  const pvdReq = input.providentFund || 0;
  const pvdRateCap = grossIncome * rules.caps.providentFund.percentOfIncome;
  const pvdMaxCap = rules.caps.providentFund.max;
  const pvdAllowedBeforeGroup = Math.min(pvdReq, pvdRateCap, pvdMaxCap);

  if (pvdReq > pvdRateCap) {
    warnings.push(`เงินสะสม PVD (${pvdReq.toLocaleString('th-TH')} บาท) เกินเกณฑ์ 15% ของเงินได้ (${pvdRateCap.toLocaleString('th-TH')} บาท)`);
  }
  if (pvdReq > pvdMaxCap) {
    warnings.push(`เงินสะสม PVD (${pvdReq.toLocaleString('th-TH')} บาท) เกินเพดาน ${pvdMaxCap.toLocaleString('th-TH')} บาท`);
  }

  const otherFundsReq = input.otherFunds || 0;

  const rmfReq = deductions.rmf || 0;
  const rmfRateCap = grossIncome * rules.caps.rmf.percentOfIncome;
  const rmfMaxCap = rules.caps.rmf.max;
  const rmfAllowedBeforeGroup = Math.min(rmfReq, rmfRateCap, rmfMaxCap);

  if (rmfReq > rmfRateCap) {
    warnings.push(`เงินซื้อ RMF (${rmfReq.toLocaleString('th-TH')} บาท) เกินเกณฑ์ 30% ของเงินได้ (${rmfRateCap.toLocaleString('th-TH')} บาท)`);
  }
  if (rmfReq > rmfMaxCap) {
    warnings.push(`เงินซื้อ RMF (${rmfReq.toLocaleString('th-TH')} บาท) เกินเพดาน ${rmfMaxCap.toLocaleString('th-TH')} บาท`);
  }

  // ตรวจเพดานรวมกลุ่มเกษียณ (500,000 บาท)
  const groupCap = rules.caps.combinedRetirementCap.max;
  let remainingGroupCap = groupCap;

  // หัก PVD ก่อน
  const pvdApplied = Math.min(pvdAllowedBeforeGroup, remainingGroupCap);
  remainingGroupCap = Math.max(0, remainingGroupCap - pvdApplied);

  // หัก กบข. / otherFunds ถัดมา
  const otherFundsApplied = Math.min(otherFundsReq, remainingGroupCap);
  remainingGroupCap = Math.max(0, remainingGroupCap - otherFundsApplied);

  // หัก RMF หลังสุด (ตัดส่วนเกินจากรายการหลังสุดก่อน)
  const rmfApplied = Math.min(rmfAllowedBeforeGroup, remainingGroupCap);
  remainingGroupCap = Math.max(0, remainingGroupCap - rmfApplied);

  const totalRetirementRequested = pvdAllowedBeforeGroup + otherFundsReq + rmfAllowedBeforeGroup;
  if (totalRetirementRequested > groupCap) {
    warnings.push(`เงินสะสมรวมกลุ่มกองทุนเกษียณอายุ (${totalRetirementRequested.toLocaleString('th-TH')} บาท) เกินเพดานรวม ${groupCap.toLocaleString('th-TH')} บาท ถูกปรับลดส่วนเกินจากรายการหลังสุดก่อน`);
  }

  if (pvdReq > 0) {
    deductionBreakdown.push({
      id: 'providentFund',
      label: 'กองทุนสำรองเลี้ยงชีพ (PVD)',
      name: 'กองทุนสำรองเลี้ยงชีพ (PVD)',
      requested: pvdReq,
      applied: pvdApplied,
      remainingCap: Math.max(0, Math.min(pvdRateCap, pvdMaxCap) - pvdApplied),
    });
  }

  if (otherFundsReq > 0) {
    deductionBreakdown.push({
      id: 'otherFunds',
      label: 'กองทุน กบข. / กองทุนอื่น',
      name: 'กองทุน กบข. / กองทุนอื่น',
      requested: otherFundsReq,
      applied: otherFundsApplied,
      remainingCap: null,
    });
  }

  if (rmfReq > 0) {
    deductionBreakdown.push({
      id: 'rmf',
      label: 'กองทุน RMF',
      name: 'กองทุน RMF',
      requested: rmfReq,
      applied: rmfApplied,
      remainingCap: Math.max(0, Math.min(rmfRateCap, rmfMaxCap) - rmfApplied),
    });
  }

  // 4.10 ดอกเบี้ยเงินกู้ยืมเพื่อซื้ออสังหาริมทรัพย์
  const homeLoanReq = deductions.homeLoanInterest || 0;
  const homeLoanCap = rules.caps.homeLoanInterest.max;
  const homeLoanApplied = Math.min(homeLoanReq, homeLoanCap);
  if (homeLoanReq > homeLoanCap) {
    warnings.push(`ดอกเบี้ยเงินกู้ยืมเพื่อซื้อบ้าน (${homeLoanReq.toLocaleString('th-TH')} บาท) เกินเพดาน ${homeLoanCap.toLocaleString('th-TH')} บาท ถูกปรับลดตามเพดาน`);
  }
  if (homeLoanReq > 0) {
    deductionBreakdown.push({
      id: 'homeLoanInterest',
      label: 'ดอกเบี้ยเงินกู้ยืมเพื่อซื้อบ้าน',
      name: 'ดอกเบี้ยกู้ยืมเพื่อซื้อบ้าน',
      requested: homeLoanReq,
      applied: homeLoanApplied,
      remainingCap: Math.max(0, homeLoanCap - homeLoanApplied),
    });
  }

  // 4.11 customDeductions (ใส่ warning ทุกครั้งเพราะไม่มีกฎรองรับ)
  if (Array.isArray(deductions.customDeductions) && deductions.customDeductions.length > 0) {
    warnings.push('มีรายการลดหย่อนกำหนดเอง (customDeductions) ที่ไม่ได้ถูกตรวจเพดานตามกฎหมาย');
    deductions.customDeductions.forEach((custom, idx) => {
      const amt = custom.amount || 0;
      const customName = custom.name || `ค่าลดหย่อนกำหนดเอง #${idx + 1}`;
      deductionBreakdown.push({
        id: `customDeduction_${idx}`,
        label: customName,
        name: customName,
        requested: amt,
        applied: amt,
        remainingCap: null,
      });
    });
  }

  // 5. เงินได้สุทธิก่อนหักเงินบริจาค
  const allowancesBeforeDonation = deductionBreakdown.reduce((sum, item) => sum + item.applied, 0);
  const netIncomeBeforeDonation = Math.max(0, taxableIncome - expenseDeduction - allowancesBeforeDonation);

  // 6. เงินบริจาค (Donations)
  const donationCapPercent = rules.caps.donationGeneral.percentOfNetIncome;
  const donationCapAmount = netIncomeBeforeDonation * donationCapPercent;

  // 6.1 บริจาคเพื่อการศึกษา (2 เท่า)
  const eduDonationReq = deductions.donationEducation || 0;
  const eduMultiplier = rules.caps.donationEducation.multiplier || 2;
  const eduMultiplied = eduDonationReq * eduMultiplier;
  const eduApplied = Math.min(eduMultiplied, donationCapAmount);

  if (eduMultiplied > donationCapAmount) {
    warnings.push(`เงินบริจาคเพื่อการศึกษา (2 เท่า = ${eduMultiplied.toLocaleString('th-TH')} บาท) เกินเพดาน 10% ของเงินได้สุทธิก่อนบริจาค (${donationCapAmount.toLocaleString('th-TH')} บาท)`);
  }
  if (eduDonationReq > 0) {
    deductionBreakdown.push({
      id: 'donationEducation',
      label: 'เงินบริจาคเพื่อการศึกษา (สิทธิ 2 เท่า)',
      name: 'เงินบริจาคเพื่อการศึกษา (สิทธิ 2 เท่า)',
      requested: eduDonationReq,
      applied: eduApplied,
      remainingCap: Math.max(0, donationCapAmount - eduApplied),
    });
  }

  // 6.2 บริจาคทั่วไป (1 เท่า)
  const remainingDonationCap = Math.max(0, donationCapAmount - eduApplied);
  const genDonationReq = deductions.donationGeneral || 0;
  const genApplied = Math.min(genDonationReq, remainingDonationCap);

  if (genDonationReq > remainingDonationCap) {
    warnings.push(`เงินบริจาคทั่วไป (${genDonationReq.toLocaleString('th-TH')} บาท) เกินเพดานสิทธิ์คงเหลือ (${remainingDonationCap.toLocaleString('th-TH')} บาท)`);
  }
  if (genDonationReq > 0) {
    deductionBreakdown.push({
      id: 'donationGeneral',
      label: 'เงินบริจาคทั่วไป',
      name: 'เงินบริจาคทั่วไป',
      requested: genDonationReq,
      applied: genApplied,
      remainingCap: Math.max(0, remainingDonationCap - genApplied),
    });
  }

  // 7. รวมค่าลดหย่อนและคำนวณเงินได้สุทธิ
  const totalAllowances = deductionBreakdown.reduce((sum, item) => sum + item.applied, 0);
  const netIncome = Math.max(0, taxableIncome - expenseDeduction - totalAllowances);

  // 8. คำนวณภาษีตามขั้นบันได (taxBrackets)
  const taxBrackets = [];
  let totalTaxCalculated = 0;
  let prevUpTo = 0;

  for (const bracket of rules.brackets) {
    const from = prevUpTo;
    const to = bracket.upTo; // number or null
    const rate = bracket.rate;

    let incomeInBracket = 0;
    if (netIncome > from) {
      const upperLimit = to !== null ? to : netIncome;
      incomeInBracket = Math.max(0, Math.min(netIncome, upperLimit) - from);
    }

    const taxInBracket = incomeInBracket * rate;
    totalTaxCalculated += taxInBracket;

    taxBrackets.push({
      from,
      to,
      rate,
      incomeInBracket: round2(incomeInBracket),
      taxInBracket: round2(taxInBracket),
    });

    if (to !== null) {
      prevUpTo = to;
    }
  }

  const taxCalculated = round2(totalTaxCalculated);
  const taxWithheld = round2(taxWithheldInput || 0);
  const amountDue = round2(taxCalculated - taxWithheld);

  if (taxWithheld > taxCalculated) {
    warnings.push('ภาษีที่หักไว้แล้วมากกว่าภาษีที่คำนวณได้ คุณมีสิทธิ์ขอคืนภาษี');
  }

  // ปัดเศษผลลัพธ์ใน breakdown
  const roundedBreakdown = deductionBreakdown.map((item) => ({
    ...item,
    actualAllowed: round2(item.applied),
    requested: round2(item.requested),
    applied: round2(item.applied),
    remainingCap: item.remainingCap !== null ? round2(item.remainingCap) : null,
  }));

  return {
    taxYear,
    grossIncome: round2(grossIncome),
    taxableIncome: round2(taxableIncome),
    expenseDeduction: round2(expenseDeduction),
    totalAllowances: round2(totalAllowances),
    netIncome: round2(netIncome),
    taxBrackets,
    taxCalculated,
    taxWithheld,
    amountDue,
    deductionBreakdown: roundedBreakdown,
    warnings,
  };
}
