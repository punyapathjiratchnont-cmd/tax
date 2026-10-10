/**
 * ============================================================================
 * ระบบคำนวณภาษีเงินได้บุคคลธรรมดา (ภ.ง.ด.91) - ES Module
 * ============================================================================
 * 
 * ตัวอย่างการใช้งาน:
 * 
 * import { calculatePnd91 } from './src/tax/calculator.js';
 * 
 * const result = calculatePnd91({
 *   taxYear: 2569,
 *   salary: 600000, // 50,000 * 12 หรือ [50000, 50000, ...]
 *   bonus: 100000,
 *   otherSalaryIncome: 0,
 *   exemptIncome: 0,
 *   socialSecurity: 9000,
 *   providentFund: 30000,
 *   maritalStatus: 'married',
 *   spouseHasNoIncome: true,
 *   children: { general: 1, born2561Onwards: 1 },
 *   parentsSupported: 2,
 *   disabledDependents: 0,
 *   deductions: {
 *     lifeInsurance: 50000,
 *     healthInsurance: 20000,
 *     parentHealthInsurance: 10000,
 *     rmf: 30000,
 *     donationEducation: 5000,
 *     donationGeneral: 2000,
 *     homeLoanInterest: 40000,
 *     customDeductions: [{ name: 'ค่าลดหย่อนพิเศษ', amount: 5000 }]
 *   },
 *   taxAlreadyWithheld: 20000
 * });
 * 
 * console.log('เงินได้สุทธิ:', result.netIncome);
 * console.log('ภาษีที่ต้องชำระเพิ่ม/ได้คืน:', result.amountDue);
 * ============================================================================
 */

import { getTaxRules } from './rules/index.js';
import { round2, sumAmount } from './utils.js';

/**
 * คำนวณภาษีเงินได้บุคคลธรรมดา (ภ.ง.ด.91)
 * @param {object} input - ข้อมูลนำเข้าสำหรับคำนวณภาษี
 * @returns {object} ผลลัพธ์การคำนวณภาษีพร้อมการสรุปและข้อเตือน
 */
export function calculatePnd91(input = {}) {
  const taxYear = input.taxYear || 2569;
  const rules = getTaxRules(taxYear);

  const warnings = [];
  const deductionBreakdown = [];

  // 1. รวมเงินได้ประเภทเงินเดือน/เงินจ้างประจำ 40(1)
  const salarySum = sumAmount(input.salary);
  const bonus = round2(input.bonus || 0);
  const otherSalaryIncome = round2(input.otherSalaryIncome || 0);
  const exemptIncome = round2(input.exemptIncome || 0);

  const totalGrossSalaryIncome = round2(salarySum + bonus + otherSalaryIncome);
  const grossIncome = totalGrossSalaryIncome;
  const taxableIncome = round2(Math.max(0, grossIncome - exemptIncome));

  // 2. หักค่าใช้จ่ายเหมา 50% ไม่เกินเพดาน (100,000 บาท)
  const calculatedExpense = round2(taxableIncome * rules.expenses.rate);
  const expenseDeduction = round2(Math.min(calculatedExpense, rules.expenses.maxAmount));

  if (calculatedExpense > rules.expenses.maxAmount) {
    warnings.push(
      `ค่าใช้จ่ายเหมา 50% (${calculatedExpense.toLocaleString('th-TH')} บาท) เกินเพดานสูงสุด ${rules.expenses.maxAmount.toLocaleString('th-TH')} บาท ระบบปรับลดให้ตามเพดาน`
    );
  }

  // 3. คำนวณค่าลดหย่อน
  // Helper สำหรับบันทึกรายการลดหย่อน
  function addDeductionItem(name, requested, allowed, cap) {
    const req = round2(requested);
    const allow = round2(allowed);
    const capVal = cap !== undefined ? round2(cap) : null;
    const remainingCap = capVal !== null ? round2(Math.max(0, capVal - allow)) : null;

    deductionBreakdown.push({
      name,
      requested: req,
      actualAllowed: allow,
      cap: capVal,
      remainingCap,
    });

    return allow;
  }

  // 3.1 ค่าลดหย่อนส่วนตัว
  const personalAllow = addDeductionItem(
    'ค่าลดหย่อนส่วนตัว',
    rules.basicAllowances.personal,
    rules.basicAllowances.personal,
    rules.basicAllowances.personal
  );

  // 3.2 ค่าลดหย่อนคู่สมรส (กรณีไม่มีรายได้)
  let spouseAllow = 0;
  if (input.maritalStatus === 'married' && input.spouseHasNoIncome) {
    spouseAllow = addDeductionItem(
      'ค่าลดหย่อนคู่สมรส (ไม่มีรายได้)',
      rules.basicAllowances.spouseNoIncome,
      rules.basicAllowances.spouseNoIncome,
      rules.basicAllowances.spouseNoIncome
    );
  }

  // 3.3 ค่าลดหย่อนบุตร
  let childrenAllow = 0;
  let childGeneralCount = 0;
  let child2561Count = 0;

  if (typeof input.children === 'object' && input.children !== null) {
    childGeneralCount = Math.max(0, parseInt(input.children.general || 0, 10));
    child2561Count = Math.max(0, parseInt(input.children.born2561Onwards || 0, 10));
  } else if (typeof input.children === 'number') {
    childGeneralCount = Math.max(0, parseInt(input.children, 10));
  }

  const childGeneralAmount = childGeneralCount * rules.basicAllowances.childGeneral;
  const child2561Amount = child2561Count * rules.basicAllowances.childBorn2561Onwards;
  const totalChildReq = childGeneralAmount + child2561Amount;

  if (totalChildReq > 0) {
    childrenAllow = addDeductionItem(
      `ค่าลดหย่อนบุตร (ทั่วไป ${childGeneralCount} คน, เกิดตั้งแต่ปี 2561 ${child2561Count} คน)`,
      totalChildReq,
      totalChildReq,
      null
    );
  }

  // 3.4 ค่าลดหย่อนบิดามารดา
  let parentAllow = 0;
  const parentsCount = Math.max(0, parseInt(input.parentsSupported || 0, 10));
  if (parentsCount > 0) {
    const parentReq = parentsCount * rules.basicAllowances.parent;
    parentAllow = addDeductionItem(
      `ค่าลดหย่อนบิดามารดา (${parentsCount} ท่าน)`,
      parentReq,
      parentReq,
      null
    );
  }

  // 3.5 ค่าลดหย่อนผู้พิการ/ทุพพลภาพ
  let disabledAllow = 0;
  const disabledCount = Math.max(0, parseInt(input.disabledDependents || 0, 10));
  if (disabledCount > 0) {
    const disabledReq = disabledCount * rules.basicAllowances.disabledDependent;
    disabledAllow = addDeductionItem(
      `ค่าลดหย่อนอุปการะผู้พิการ (${disabledCount} คน)`,
      disabledReq,
      disabledReq,
      null
    );
  }

  // 3.6 ประกันสังคม
  const socialSecReq = round2(input.socialSecurity || 0);
  const socialSecAllow = Math.min(socialSecReq, rules.caps.socialSecurity);
  if (socialSecReq > rules.caps.socialSecurity) {
    warnings.push(
      `เงินสมทบประกันสังคม (${socialSecReq.toLocaleString('th-TH')} บาท) เกินเพดาน ${rules.caps.socialSecurity.toLocaleString('th-TH')} บาท ระบบปรับลดเป็นเพดานสูงสุด`
    );
  }
  addDeductionItem('ประกันสังคม', socialSecReq, socialSecAllow, rules.caps.socialSecurity);

  // 3.7 ประกันชีวิต และประกันสุขภาพตนเอง
  const deductionsInput = input.deductions || {};
  const lifeInsReq = round2(deductionsInput.lifeInsurance || 0);
  const healthInsReq = round2(deductionsInput.healthInsurance || 0);

  const healthInsAllowed = Math.min(healthInsReq, rules.caps.healthInsurance);
  if (healthInsReq > rules.caps.healthInsurance) {
    warnings.push(
      `เบี้ยประกันสุขภาพตนเอง (${healthInsReq.toLocaleString('th-TH')} บาท) เกินเพดาน ${rules.caps.healthInsurance.toLocaleString('th-TH')} บาท ระบบปรับลดให้ตามเพดาน`
    );
  }

  const combinedInsuranceReq = lifeInsReq + healthInsAllowed;
  const combinedInsuranceAllowed = Math.min(combinedInsuranceReq, rules.caps.combinedLifeAndHealth);
  if (combinedInsuranceReq > rules.caps.combinedLifeAndHealth) {
    warnings.push(
      `รวมเบี้ยประกันชีวิตและสุขภาพ (${combinedInsuranceReq.toLocaleString('th-TH')} บาท) เกินเพดานรวม ${rules.caps.combinedLifeAndHealth.toLocaleString('th-TH')} บาท ระบบปรับลดเป็นเพดานสูงสุด`
    );
  }

  addDeductionItem(
    'ประกันชีวิตและประกันสุขภาพตนเอง',
    lifeInsReq + healthInsReq,
    combinedInsuranceAllowed,
    rules.caps.combinedLifeAndHealth
  );

  // 3.8 ประกันสุขภาพบิดามารดา
  const parentHealthReq = round2(deductionsInput.parentHealthInsurance || 0);
  const parentHealthAllow = Math.min(parentHealthReq, rules.caps.parentHealthInsurance);
  if (parentHealthReq > rules.caps.parentHealthInsurance) {
    warnings.push(
      `เบี้ยประกันสุขภาพบิดามารดา (${parentHealthReq.toLocaleString('th-TH')} บาท) เกินเพดาน ${rules.caps.parentHealthInsurance.toLocaleString('th-TH')} บาท ระบบปรับลดให้ตามเพดาน`
    );
  }
  addDeductionItem(
    'ประกันสุขภาพบิดามารดา',
    parentHealthReq,
    parentHealthAllow,
    rules.caps.parentHealthInsurance
  );

  // 3.9 กลุ่มกองทุนเกษียณอายุ (PVD + กบข./อื่นๆ + RMF)
  const pvdReq = round2(input.providentFund || 0);
  const otherFundsReq = round2(input.otherFunds || 0);
  const rmfReq = round2(deductionsInput.rmf || 0);

  // ตรวจเพดาน PVD (% ของเงินได้)
  const pvdCapByRate = round2(totalGrossSalaryIncome * rules.caps.pvdRateLimit);
  const pvdAllowedByRate = Math.min(pvdReq, pvdCapByRate);
  if (pvdReq > pvdCapByRate) {
    warnings.push(
      `เงินสะสม PVD (${pvdReq.toLocaleString('th-TH')} บาท) เกินเกณฑ์ 15% ของเงินได้ (${pvdCapByRate.toLocaleString('th-TH')} บาท)`
    );
  }

  // ตรวจเพดาน RMF (% ของเงินได้)
  const rmfCapByRate = round2(totalGrossSalaryIncome * rules.caps.rmfRateLimit);
  const rmfAllowedByRate = Math.min(rmfReq, rmfCapByRate);
  if (rmfReq > rmfCapByRate) {
    warnings.push(
      `เงินค่าซื้อ RMF (${rmfReq.toLocaleString('th-TH')} บาท) เกินเกณฑ์ 30% ของเงินได้ (${rmfCapByRate.toLocaleString('th-TH')} บาท)`
    );
  }

  // ตรวจเพดานรวมกลุ่มเกษียณ (500,000 บาท)
  const retirementPoolReq = pvdAllowedByRate + otherFundsReq + rmfAllowedByRate;
  const retirementPoolAllowed = Math.min(retirementPoolReq, rules.caps.retirementGroupTotalCap);

  if (retirementPoolReq > rules.caps.retirementGroupTotalCap) {
    warnings.push(
      `เงินสะสมรวมกลุ่มกองทุนการออมเพื่อการเกษียณ (${retirementPoolReq.toLocaleString('th-TH')} บาท) เกินเพดานรวม ${rules.caps.retirementGroupTotalCap.toLocaleString('th-TH')} บาท ระบบปรับลดให้ตามเพดานรวม`
    );
  }

  addDeductionItem(
    'กองทุนการออมเพื่อการเกษียณ (PVD / กบข. / RMF)',
    pvdReq + otherFundsReq + rmfReq,
    retirementPoolAllowed,
    rules.caps.retirementGroupTotalCap
  );

  // 3.10 ดอกเบี้ยเงินกู้ยืมเพื่อซื้ออสังหาริมทรัพย์
  const homeInterestReq = round2(deductionsInput.homeLoanInterest || 0);
  const homeInterestAllow = Math.min(homeInterestReq, rules.caps.homeLoanInterest);
  if (homeInterestReq > rules.caps.homeLoanInterest) {
    warnings.push(
      `ดอกเบี้ยเงินกู้ยืมเพื่อซื้อบ้าน (${homeInterestReq.toLocaleString('th-TH')} บาท) เกินเพดาน ${rules.caps.homeLoanInterest.toLocaleString('th-TH')} บาท ระบบปรับลดให้ตามเพดาน`
    );
  }
  addDeductionItem(
    'ดอกเบี้ยกู้ยืมเพื่อซื้อบ้าน',
    homeInterestReq,
    homeInterestAllow,
    rules.caps.homeLoanInterest
  );

  // 3.11 ค่าลดหย่อนอื่นๆ เพิ่มเติมที่ผู้ใช้ระบุ (customDeductions)
  let customDeductionsSum = 0;
  if (Array.isArray(deductionsInput.customDeductions)) {
    deductionsInput.customDeductions.forEach((customItem) => {
      if (customItem && customItem.name && !isNaN(customItem.amount)) {
        const customAmt = round2(customItem.amount);
        customDeductionsSum += customAmt;
        addDeductionItem(customItem.name, customAmt, customAmt, null);
      }
    });
  }

  // 4. คำนวณเงินได้สุทธิก่อนหักเงินบริจาค
  const sumStandardDeductions = round2(
    deductionBreakdown.reduce((acc, curr) => acc + curr.actualAllowed, 0)
  );

  const netIncomeBeforeDonation = Math.max(0, round2(taxableIncome - expenseDeduction - sumStandardDeductions));

  // 5. คำนวณเงินบริจาค ( Donaton Caps = 10% ของเงินได้หลังหักค่าใช้จ่ายและค่าลดหย่อน)
  const maxDonationCap = round2(netIncomeBeforeDonation * rules.caps.donationEducationRate);

  // 5.1 บริจาคการศึกษา/กีฬา (หักได้ 2 เท่า)
  const eduDonationReq = round2(deductionsInput.donationEducation || 0);
  const eduDonationMultiplied = round2(eduDonationReq * rules.caps.donationEducationMultiplier);
  const eduDonationAllowed = Math.min(eduDonationMultiplied, maxDonationCap);

  if (eduDonationMultiplied > maxDonationCap) {
    warnings.push(
      `เงินบริจาคการศึกษา/กีฬา (2 เท่า = ${eduDonationMultiplied.toLocaleString('th-TH')} บาท) เกินสิทธิสัดส่วน 10% ของเงินได้หลังหักลดหย่อน (${maxDonationCap.toLocaleString('th-TH')} บาท)`
    );
  }

  addDeductionItem(
    'เงินบริจาคการศึกษา/กีฬา (สิทธิ 2 เท่า)',
    eduDonationReq,
    eduDonationAllowed,
    maxDonationCap
  );

  // 5.2 บริจาคทั่วไป (1 เท่า)
  const remainingDonationCap = Math.max(0, round2(maxDonationCap - eduDonationAllowed));
  const genDonationReq = round2(deductionsInput.donationGeneral || 0);
  const genDonationAllowed = Math.min(genDonationReq, remainingDonationCap);

  if (genDonationReq > remainingDonationCap) {
    warnings.push(
      `เงินบริจาคทั่วไป (${genDonationReq.toLocaleString('th-TH')} บาท) เกินสิทธิ์เพดานคงเหลือ (${remainingDonationCap.toLocaleString('th-TH')} บาท)`
    );
  }

  addDeductionItem(
    'เงินบริจาคทั่วไป',
    genDonationReq,
    genDonationAllowed,
    maxDonationCap
  );

  // รวมค่าลดหย่อนและเงินบริจาคทั้งหมด
  const totalAllowances = round2(
    deductionBreakdown.reduce((acc, curr) => acc + curr.actualAllowed, 0)
  );

  // 6. เงินได้สุทธิสุดท้าย (Net Taxable Income)
  const netIncome = Math.max(0, round2(taxableIncome - expenseDeduction - totalAllowances));

  // 7. คำนวณภาษีตามขั้นบันได
  const taxBrackets = [];
  let totalTaxCalculated = 0;

  for (const bracket of rules.taxBrackets) {
    let taxableInBracket = 0;
    let taxInBracket = 0;

    if (netIncome > bracket.min) {
      taxableInBracket = round2(Math.min(netIncome, bracket.max) - bracket.min);
      taxInBracket = round2(taxableInBracket * bracket.rate);
      totalTaxCalculated = round2(totalTaxCalculated + taxInBracket);
    }

    taxBrackets.push({
      title: bracket.title,
      min: bracket.min,
      max: bracket.max,
      rate: bracket.rate,
      taxableInBracket,
      taxInBracket,
    });
  }

  const taxCalculated = round2(totalTaxCalculated);
  const taxWithheld = round2(input.taxAlreadyWithheld || 0);

  // 8. ยอดต้องชำระเพิ่ม หรือ ได้คืนภาษี (บวก = ชำระเพิ่ม, ลบ = ได้คืน)
  const amountDue = round2(taxCalculated - taxWithheld);

  return {
    taxYear,
    grossIncome,
    taxableIncome,
    expenseDeduction,
    totalAllowances,
    netIncome,
    taxBrackets,
    taxCalculated,
    taxWithheld,
    amountDue,
    deductionBreakdown,
    warnings,
  };
}
