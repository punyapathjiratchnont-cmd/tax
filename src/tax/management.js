/**
 * ============================================================================
 * โมดูลคำแนะนำการจัดการและปฏิบัติตามกฎหมายภาษีเงินได้บุคคลธรรมดา (ภ.ง.ด.91)
 * ============================================================================
 * 
 * วิเคราะห์กำหนดเวลา เอกสารที่ต้องจัดเก็บ ยอดชำระ/ขอคืนภาษี
 * และเงื่อนไขที่ควรปรึกษาผู้เชี่ยวชาญ โดยใช้ค่าจาก result และ rules
 */

import { getTaxRules } from './rules/index.js';

/**
 * วิเคราะห์และให้คำแนะนำการจัดการภาษี
 * @param {object} input - ข้อมูลนำเข้าสำหรับคำนวณภาษี
 * @param {object} result - ผลลัพธ์การคำนวณจาก calculatePnd91
 * @param {object} [rulesInput] - กฎประจำปีภาษี
 * @param {Date|string} [todayInput] - วันที่ปัจจุบันสำหรับเปรียบเทียบกำหนดเวลา
 * @returns {object} { deadline, payment, documents, professionalAdvice, refusal }
 */
export function getTaxManagementAdvice(input = {}, result = {}, rulesInput = null, todayInput = new Date()) {
  // 0. ตรวจสอบกรณีขอคำแนะนำเกี่ยวกับการหลีกเลี่ยงภาษี / ปกปิดรายได้ (Refusal Check)
  if (
    input.requestEvasion ||
    input.hideIncome ||
    input.falseData ||
    input.evadeTax
  ) {
    return {
      deadline: null,
      payment: null,
      documents: [],
      professionalAdvice: [],
      refusal: {
        message:
          'ไม่สามารถให้คำแนะนำเกี่ยวกับการปกปิดรายได้ การแจ้งข้อมูลเท็จ หรือการหลีกเลี่ยงภาษีได้ กรุณายื่นแบบแสดงรายการตามความเป็นจริงและตรวจสอบหลักเกณฑ์กับกรมสรรพากรหรือผู้เชี่ยวชาญทางภาษี',
      },
    };
  }

  const taxYear = input.taxYear || result.taxYear || 2569;
  const rules = rulesInput || getTaxRules(taxYear);

  // Parse Today date
  const today = todayInput instanceof Date ? todayInput : new Date(todayInput);

  // 1. วิเคราะห์กำหนดเวลา (Deadline Analysis)
  const deadlines = rules.deadlines || {
    paperFilingDate: '31 มีนาคม 2570',
    onlineFilingDate: '8 เมษายน 2570',
    paymentDate: '8 เมษายน 2570',
    onlineFilingIsoDate: '2027-04-08T23:59:59+07:00',
  };

  const deadlineDate = new Date(deadlines.onlineFilingIsoDate);
  const diffTime = deadlineDate.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const urgent = daysLeft >= 0 && daysLeft <= 30;
  const pastDue = daysLeft < 0;

  let deadlineMessage = `กำหนดวันยื่นแบบและชำระภาษีออนไลน์ได้ถึงวันที่ ${deadlines.onlineFilingDate} (ควรตรวจสอบกำหนดเวลาอัปเดตกับกรมสรรพากร)`;
  if (pastDue) {
    deadlineMessage = `กำหนดการยื่นภาษีออนไลน์ประจำปีภาษี ${taxYear} (${deadlines.onlineFilingDate}) ได้ผ่านพ้นไปแล้ว กรุณาติดต่อกรมสรรพากรเพื่อยื่นแบบย้อนหลัง ซึ่งอาจมีค่าปรับและเงินเพิ่มตามที่กฎหมายกำหนด`;
  } else if (urgent) {
    deadlineMessage = `กำหนดวันยื่นแบบและชำระภาษีออนไลน์ใกล้เข้ามาแล้ว เหลือเวลาอีก ${daysLeft} วัน (ภายในวันที่ ${deadlines.onlineFilingDate})`;
  }

  const deadline = {
    filingDate: deadlines.onlineFilingDate,
    paymentDate: deadlines.paymentDate,
    daysLeft,
    urgent,
    pastDue,
    message: deadlineMessage,
  };

  // 2. การเตรียมเงิน หรือ การรับเงินคืน (Payment Analysis)
  const amountDue = result.amountDue || 0;
  let paymentType = 'none';
  let paymentMessage = 'ไม่มียอดภาษีต้องชำระเพิ่มเติมหรือได้รับคืน (แนะนำให้ตรวจสอบกับกรมสรรพากรอีกครั้งก่อนยื่นจริง)';
  const installmentEligible = amountDue > 3000;

  if (amountDue > 0) {
    paymentType = 'due';
    paymentMessage = `มียอดภาษีต้องชำระเพิ่มเติมจำนวน ฿${amountDue.toLocaleString('th-TH', { minimumFractionDigits: 2 })} กรุณาเตรียมเงินไว้ก่อนถึงกำหนดวันที่ ${deadlines.paymentDate}`;
    if (installmentEligible) {
      paymentMessage += ` (หากยอดภาษีเกิน 3,000 บาท สามารถใช้สิทธิผ่อนชำระได้ 3 งวดตามเงื่อนไขของกรมสรรพากร)`;
    }
    paymentMessage += ' (ควรตรวจสอบกับกรมสรรพากรหรือสถาบันการเงินก่อนชำระจริง)';
  } else if (amountDue < 0) {
    paymentType = 'refund';
    const refundAmount = Math.abs(amountDue);
    paymentMessage = `คุณมีสิทธิได้รับเงินคืนภาษีโดยประมาณ ฿${refundAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} กรุณาตรวจสอบ บัญชีพร้อมเพย์ ที่ผูกกับเลขประจำตัวประชาชน หรือบัญชีธนาคารเพื่อรับเงินคืนภาษี (ควรตรวจสอบสถานะการคืนภาษีกับกรมสรรพากรอีกครั้ง)`;
  }

  const payment = {
    type: paymentType,
    amount: Math.abs(amountDue),
    installmentEligible,
    message: paymentMessage,
  };

  // 3. เอกสารที่ควรจัดเก็บ (Documents List)
  const docReason = 'เก็บไว้เพื่อใช้อ้างอิงหากกรมสรรพากรขอตรวจสอบ';
  const documents = [
    {
      name: 'หนังสือรับรองการหักภาษี ณ ที่จ่าย (ใบ 50 ทวิ) หรือสลิปเงินเดือนสรุปประจำปี',
      reason: docReason,
    },
  ];

  const deductions = input.deductions || {};

  if ((deductions.lifeInsurance || 0) > 0 || (deductions.healthInsurance || 0) > 0) {
    documents.push({
      name: 'ใบเสร็จรับเงินหรือหนังสือรับรองการชำระเบี้ยประกันชีวิต / ประกันสุขภาพ',
      reason: docReason,
    });
  }

  if ((deductions.parentHealthInsurance || 0) > 0) {
    documents.push({
      name: 'หนังสือรับรองการชำระเบี้ยประกันสุขภาพบิดามารดา',
      reason: docReason,
    });
  }

  if ((deductions.donationEducation || 0) > 0 || (deductions.donationGeneral || 0) > 0) {
    documents.push({
      name: 'ใบอนุโมทนาบัตร หรือใบเสร็จรับเงินบริจาค (หรือข้อมูลผ่านระบบ e-Donation)',
      reason: docReason,
    });
  }

  if ((deductions.homeLoanInterest || 0) > 0) {
    documents.push({
      name: 'หนังสือรับรองดอกเบี้ยเงินกู้ยืมเพื่อซื้ออาคารที่อยู่อาศัยจากสถาบันการเงิน',
      reason: docReason,
    });
  }

  if (
    input.maritalStatus === 'married' ||
    (input.children && (input.children.general > 0 || input.children.born2561Onwards > 0)) ||
    input.childrenGeneral > 0 ||
    input.childrenBorn2561Onwards > 0
  ) {
    documents.push({
      name: 'สำเนาทะเบียนสมรส และสำเนาสูติบัตรบุตร',
      reason: docReason,
    });
  }

  if ((input.parentsSupported || 0) > 0) {
    documents.push({
      name: 'หนังสือรับรองการหักลดหย่อนบิดามารดา (กย.02)',
      reason: docReason,
    });
  }

  if ((input.disabledDependents || 0) > 0) {
    documents.push({
      name: 'บัตรประจำตัวผู้พิการและหนังสือรับรองการเป็นผู้ดูแลผู้พิการ',
      reason: docReason,
    });
  }

  // 4. เงื่อนไขที่ควรปรึกษาผู้เชี่ยวชาญ (Professional Advice List)
  const professionalAdvice = [];
  const profReasonSuffix = ' (แนะนำให้ตรวจสอบกับกรมสรรพากรหรือผู้เชี่ยวชาญทางภาษีก่อนยื่นจริง)';

  if ((input.otherSalaryIncome || 0) > 0 || (input.otherIncome || 0) > 0 || (input.freelanceIncome || 0) > 0) {
    professionalAdvice.push({
      reason: `มีเงินได้ประเภทอื่นนอกเหนือจากเงินเดือนประจำ เช่น ค่าเช่า ค่าจ้างอิสระ หรือดอกเบี้ย ควรตรวจสอบการจัดประเภทเงินได้และหักค่าใช้จ่ายให้ถูกต้อง${profReasonSuffix}`,
    });
  }

  if (input.withheldRows && input.withheldRows.length > 1) {
    professionalAdvice.push({
      reason: `มีเงินได้จากนายจ้างหลายแห่ง ควรตรวจสอบยอดรวมเงินได้และภาษีหัก ณ ที่จ่ายจากใบ 50 ทวิ ทุกแห่งให้ครบถ้วนก่อนยื่นแบบ${profReasonSuffix}`,
    });
  }

  const sigThreshold = rules.significantTaxDueThreshold || 20000;
  if (amountDue > sigThreshold) {
    professionalAdvice.push({
      reason: `ยอดภาษีที่ต้องชำระเพิ่มมีจำนวนมาก (เกินกว่า ฿${sigThreshold.toLocaleString('th-TH')}) ควรวางแผนการชำระเงินและตรวจสอบสิทธิลดหย่อนเพิ่มเติม${profReasonSuffix}`,
    });
  }

  if (result.warnings && result.warnings.length > 0) {
    professionalAdvice.push({
      reason: `มีรายการค่าลดหย่อนที่เกินเพดานตามกฎหมายและถูกปรับลดลง ควรตรวจสอบเกณฑ์เพดานกับกรมสรรพากร${profReasonSuffix}`,
    });
  }

  if (input.complexFamilyStatus) {
    professionalAdvice.push({
      reason: `มีสถานะครอบครัวหรือบุตรในความดูแลร่วมกัน อยู่ระหว่างการหย่า หรือมีเงื่อนไขซับซ้อน ควรปรึกษาผู้เชี่ยวชาญเพื่อใช้สิทธิลดหย่อนได้ถูกต้อง${profReasonSuffix}`,
    });
  }

  return {
    deadline,
    payment,
    documents,
    professionalAdvice,
    refusal: null,
  };
}
