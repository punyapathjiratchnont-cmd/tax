/**
 * ============================================================================
 * โมดูลคำแนะนำการลดหย่อนภาษีเงินได้บุคคลธรรมดา (ภ.ง.ด.91)
 * ============================================================================
 * 
 * ทำหน้าที่วิเคราะห์สิทธิลดหย่อนที่ยังเหลืออยู่ จำลองการลงทุนเพิ่มเติม
 * คำนวณภาษีที่ประหยัดได้จริงด้วยเอนจิน calculatePnd91 โดยไม่ทำลายข้อมูลเดิม
 */

import { calculatePnd91 } from './calculator.js';
import { getTaxRules } from './rules/index.js';
import { round2 } from './utils.js';

// ข้อมูลเงื่อนไขและรายละเอียดสิทธิแต่ละประเภท (Condition Notes)
const DEDUCTION_METADATA = {
  lifeInsurance: {
    id: 'lifeInsurance',
    label: 'ประกันชีวิตทั่วไป',
    conditionNote: 'ต้องเป็นประกันชีวิตที่มีระยะเวลาคุ้มครองตั้งแต่ 10 ปีขึ้นไป (รวมประกันสุขภาพไม่เกิน 100,000 บาท)',
  },
  healthInsurance: {
    id: 'healthInsurance',
    label: 'ประกันสุขภาพตนเอง',
    conditionNote: 'หักลดหย่อนได้ตามจ่ายจริงไม่เกิน 25,000 บาท (และเมื่อรวมกับประกันชีวิตต้องไม่เกิน 100,000 บาท)',
  },
  parentHealthInsurance: {
    id: 'parentHealthInsurance',
    label: 'ประกันสุขภาพบิดามารดา',
    conditionNote: 'บิดามารดาต้องมีเงินได้พึงประเมินไม่เกิน 30,000 บาทต่อปี',
  },
  rmf: {
    id: 'rmf',
    label: 'กองทุนเพื่อการเลี้ยงชีพ (RMF)',
    conditionNote: 'ต้องถือครองจนถึงอายุ 55 ปีบริบูรณ์ และต้องลงทุนต่อเนื่องไม่น้อยกว่า 5 ปีเต็ม',
  },
  providentFund: {
    id: 'providentFund',
    label: 'กองทุนสำรองเลี้ยงชีพ (PVD)',
    conditionNote: 'สะสมได้ไม่เกิน 15% ของเงินได้ และรวมในกลุ่มเกษียณไม่เกิน 500,000 บาท',
  },
  homeLoanInterest: {
    id: 'homeLoanInterest',
    label: 'ดอกเบี้ยเงินกู้ยืมเพื่อซื้อบ้าน',
    conditionNote: 'ต้องเป็นดอกเบี้ยกู้ยืมเพื่อซื้อหรือสร้างอาคารที่อยู่อาศัยจริง',
  },
  donationEducation: {
    id: 'donationEducation',
    label: 'เงินบริจาคเพื่อการศึกษา/กีฬา/โรงพยาบาลรัฐ',
    conditionNote: 'ได้รับสิทธิหักลดหย่อน 2 เท่าของยอดบริจาคจริง (ไม่เกิน 10% ของเงินได้หลังหักลดหย่อน)',
  },
  donationGeneral: {
    id: 'donationGeneral',
    label: 'เงินบริจาคทั่วไป',
    conditionNote: 'หักลดหย่อนได้ตามจ่ายจริง (ไม่เกิน 10% ของเงินได้หลังหักลดหย่อน)',
  },
};

/**
 * วิเคราะห์และสร้างรายการคำแนะนำการลดหย่อนภาษี
 * @param {object} input - ข้อมูลนำเข้าของฟอร์ม
 * @param {object} result - ผลลัพธ์จากการคำนวณ calculatePnd91(input)
 * @param {object} [rulesInput] - กฎและเพดานภาษีประจำปี (ถ้าไม่ระบุจะดึงอัตโนมัติ)
 * @returns {object} ผลลัพธ์คำแนะนำ { adviceList, warnings, message }
 */
export function getDeductionAdvice(input = {}, result = {}, rulesInput = null) {
  const taxYear = input.taxYear || result.taxYear || 2569;
  const rules = rulesInput || getTaxRules(taxYear);

  const warnings = [];
  const adviceList = [];

  // หากไม่มีภาระภาษีต้องจ่าย (ภาษีคำนวณเป็น 0)
  if (!result || result.taxCalculated <= 0) {
    return {
      adviceList: [],
      warnings: [],
      message: 'ยินดีด้วย! คุณไม่มีภาระภาษีที่ต้องชำระในปีนี้ จึงไม่จำเป็นต้องเพิ่มค่าลดหย่อน',
    };
  }

  // คำนวณเพดานสิทธิ์คงเหลือของแต่ละรายการ
  const grossIncome = result.grossIncome || 0;
  const deductionsBreakdown = result.deductionBreakdown || [];

  // 1. ประกันชีวิตทั่วไป
  const lifeInsBreakdown = deductionsBreakdown.find((i) => i.name.includes('ประกันชีวิต'));
  const lifeInsUsed = lifeInsBreakdown ? lifeInsBreakdown.requested : (input.deductions?.lifeInsurance || 0);
  const remainingLifeInsCap = Math.max(0, round2(rules.caps.lifeInsurance - lifeInsUsed));

  // 2. ประกันสุขภาพตนเอง
  const healthInsUsed = input.deductions?.healthInsurance || 0;
  const remainingHealthInsCap = Math.max(0, round2(rules.caps.healthInsurance - healthInsUsed));

  // 3. ประกันสุขภาพบิดามารดา
  const parentHealthUsed = input.deductions?.parentHealthInsurance || 0;
  const remainingParentHealthCap = Math.max(0, round2(rules.caps.parentHealthInsurance - parentHealthUsed));

  // 4. RMF
  const rmfUsed = input.deductions?.rmf || 0;
  const maxRmfCapByIncome = round2(grossIncome * rules.caps.rmfRateLimit);
  const remainingRmfCap = Math.max(0, round2(Math.min(maxRmfCapByIncome, rules.caps.retirementGroupTotalCap) - rmfUsed));

  // 5. PVD
  const pvdUsed = input.providentFund || 0;
  const maxPvdCapByIncome = round2(grossIncome * rules.caps.pvdRateLimit);
  const remainingPvdCap = Math.max(0, round2(maxPvdCapByIncome - pvdUsed));

  // 6. ดอกเบี้ยกู้บ้าน
  const homeLoanUsed = input.deductions?.homeLoanInterest || 0;
  const remainingHomeCap = Math.max(0, round2(rules.caps.homeLoanInterest - homeLoanUsed));

  // 7. เงินบริจาคการศึกษา (สิทธิ 2 เท่า)
  const eduDonationUsed = input.deductions?.donationEducation || 0;
  const maxDonationCap = round2((grossIncome * 0.5) * 0.10); // ประมาณการคร่าวๆ
  const remainingEduDonationCap = Math.max(0, round2(maxDonationCap - eduDonationUsed));

  // รวบรวมสิทธิ์ที่ยังมีเพดานคงเหลือ > 0
  const candidateItems = [
    { key: 'lifeInsurance', targetField: 'deductions.lifeInsurance', remainingCap: remainingLifeInsCap },
    { key: 'healthInsurance', targetField: 'deductions.healthInsurance', remainingCap: remainingHealthInsCap },
    { key: 'parentHealthInsurance', targetField: 'deductions.parentHealthInsurance', remainingCap: remainingParentHealthCap },
    { key: 'rmf', targetField: 'deductions.rmf', remainingCap: remainingRmfCap },
    { key: 'providentFund', targetField: 'providentFund', remainingCap: remainingPvdCap },
    { key: 'homeLoanInterest', targetField: 'deductions.homeLoanInterest', remainingCap: remainingHomeCap },
    { key: 'donationEducation', targetField: 'deductions.donationEducation', remainingCap: remainingEduDonationCap },
  ];

  // จำลองการลงทุนและคำนวณภาษีที่ประหยัดได้ด้วยการเรียก calculatePnd91
  for (const candidate of candidateItems) {
    if (candidate.remainingCap <= 0) continue;

    const meta = DEDUCTION_METADATA[candidate.key];
    if (!meta) continue;

    // สร้าง Scenarios: 10,000, 50,000 และ เต็มเพดานที่เหลือ
    const testAmounts = [];
    if (candidate.remainingCap >= 10000) testAmounts.push(10000);
    if (candidate.remainingCap >= 50000 && candidate.remainingCap > 10000) testAmounts.push(50000);
    testAmounts.push(candidate.remainingCap);

    // กรองค่านับที่ไม่ซ้ำ
    const uniqueAmounts = [...new Set(testAmounts)].sort((a, b) => a - b);
    const scenarios = [];

    for (const addAmount of uniqueAmounts) {
      // Clone input อย่างปลอดภัย
      const clonedInput = JSON.parse(JSON.stringify(input));

      // ปรับเปลี่ยนเฉพาะค่ารายการที่กำลังจำลอง
      if (candidate.targetField.startsWith('deductions.')) {
        const subField = candidate.targetField.replace('deductions.', '');
        if (!clonedInput.deductions) clonedInput.deductions = {};
        clonedInput.deductions[subField] = (clonedInput.deductions[subField] || 0) + addAmount;
      } else {
        clonedInput[candidate.targetField] = (clonedInput[candidate.targetField] || 0) + addAmount;
      }

      // คำนวณภาษีใหม่ผ่าน calculatePnd91 เท่านั้น
      const simResult = calculatePnd91(clonedInput);
      const taxSaved = Math.max(0, round2(result.taxCalculated - simResult.taxCalculated));

      scenarios.push({
        amount: addAmount,
        taxSaved,
      });
    }

    // คำนวณประสิทธิภาพประหยัดภาษีต่อบาท (อัตราภาษีที่ประหยัดได้มากที่สุดใน scenario)
    const maxEfficiency = Math.max(...scenarios.map((s) => (s.amount > 0 ? s.taxSaved / s.amount : 0)));

    adviceList.push({
      id: meta.id,
      label: meta.label,
      remainingCap: candidate.remainingCap,
      scenarios,
      conditionNote: meta.conditionNote,
      priority: maxEfficiency,
    });
  }

  // เรียงลำดับคำแนะนำจากภาษีที่ประหยัดได้ต่อบาทสูงสุดไปหาน้อยสุด
  adviceList.sort((a, b) => b.priority - a.priority);

  // ตรวจความซ้ำซ้อนและเตือนเพดานกลุ่ม
  const totalRetirementReq = (input.providentFund || 0) + (input.otherFunds || 0) + (input.deductions?.rmf || 0);
  if (totalRetirementReq > rules.caps.retirementGroupTotalCap) {
    warnings.push(
      `คุณใส่ยอดรวมกลุ่มเกษียณ (PVD + กบข. + RMF) เท่ากับ ${totalRetirementReq.toLocaleString('th-TH')} บาท ซึ่งเกินเพดานรวม ${rules.caps.retirementGroupTotalCap.toLocaleString('th-TH')} บาท`
    );
  }

  const totalLifeHealthReq = (input.deductions?.lifeInsurance || 0) + (input.deductions?.healthInsurance || 0);
  if (totalLifeHealthReq > rules.caps.combinedLifeAndHealth) {
    warnings.push(
      `คุณใส่ยอดรวมประกันชีวิตและสุขภาพตนเองเท่ากับ ${totalLifeHealthReq.toLocaleString('th-TH')} บาท ซึ่งเกินเพดานรวม ${rules.caps.combinedLifeAndHealth.toLocaleString('th-TH')} บาท`
    );
  }

  if (adviceList.length === 0) {
    return {
      adviceList: [],
      warnings,
      message: 'ใช้สิทธิ์ลดหย่อนครบแล้ว',
    };
  }

  return {
    adviceList,
    warnings,
    message: `พบสิทธิลดหย่อนที่คุณยังใช้ไม่เต็มเพดานอีก ${adviceList.length} รายการที่สามารถช่วยประหยัดภาษีได้เพิ่มเติม`,
  };
}
