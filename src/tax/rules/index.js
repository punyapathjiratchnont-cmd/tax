import rule2569 from './2569.js';

// ทะเบียนเก็บข้อมูลกฎภาษีแยกตามปี
const rulesRegistry = {
  2569: rule2569,
  2026: rule2569, // อุปมาปี ค.ศ. 2026 -> 2569
};

/**
 * ดึงรายการปีภาษีที่มีข้อมูลในระบบ
 * @returns {number[]} อาร์เรย์ของปีภาษีที่มีข้อมูล
 */
export function availableYears() {
  const years = Object.keys(rulesRegistry)
    .map(Number)
    .filter((y) => y >= 2500); // แสดงเฉพาะปี พ.ศ.
  return [...new Set(years)].sort((a, b) => a - b);
}

/**
 * ตรวจสอบความถูกต้องสมบูรณ์ของโครงสร้างข้อมูลกฎภาษี
 * @param {object} rules - โครงสร้างกฎภาษีที่ต้องการตรวจสอบ
 * @returns {object} { ok: boolean, valid: boolean, errors: string[] }
 */
export function validateRules(rules) {
  const errors = [];

  if (!rules || typeof rules !== 'object') {
    return { ok: false, valid: false, errors: ['โครงสร้างกฎภาษีต้องเป็น Object'] };
  }

  // 1. ตรวจสอบฟิลด์บังคับ
  const requiredFields = [
    'taxYear',
    'brackets',
    'expenseDeduction',
    'personalAllowance',
    'spouseAllowance',
    'childAllowance',
    'childBirth2018Allowance',
    'parentAllowance',
    'disabledAllowance',
    'caps',
    'filing',
    'installmentThreshold',
  ];

  for (const field of requiredFields) {
    if (rules[field] === undefined || rules[field] === null) {
      errors.push(`ขาดฟิลด์บังคับหรือฟิลด์เป็น null: ${field}`);
    }
  }

  // 2. ตรวจสอบค่าตัวเลขไม่ติดลบ และไม่เป็น null ในฟิลด์ที่จำเป็น
  const numericCheck = [
    { name: 'personalAllowance', val: rules.personalAllowance },
    { name: 'spouseAllowance', val: rules.spouseAllowance },
    { name: 'childAllowance', val: rules.childAllowance },
    { name: 'childBirth2018Allowance', val: rules.childBirth2018Allowance },
    { name: 'parentAllowance', val: rules.parentAllowance },
    { name: 'disabledAllowance', val: rules.disabledAllowance },
    { name: 'installmentThreshold', val: rules.installmentThreshold },
  ];

  for (const item of numericCheck) {
    if (item.val === null) {
      errors.push(`ฟิลด์ ${item.name} ไม่แน่ใจค่า (เป็น null)`);
    } else if (typeof item.val === 'number' && item.val < 0) {
      errors.push(`ฟิลด์ ${item.name} ต้องไม่ติดลบ`);
    }
  }

  if (rules.expenseDeduction) {
    if (rules.expenseDeduction.rate === null || (typeof rules.expenseDeduction.rate === 'number' && rules.expenseDeduction.rate < 0)) {
      errors.push('อัตราหักค่าใช้จ่าย (expenseDeduction.rate) ต้องเป็นตัวเลขไม่ติดลบ');
    }
    if (rules.expenseDeduction.max === null || (typeof rules.expenseDeduction.max === 'number' && rules.expenseDeduction.max < 0)) {
      errors.push('เพดานหักค่าใช้จ่าย (expenseDeduction.max) ต้องเป็นตัวเลขไม่ติดลบ');
    }
  }

  // 3. ตรวจสอบตารางขั้นบันไดอัตราภาษี (เรียงลำดับจากน้อยไปมาก)
  if (Array.isArray(rules.brackets)) {
    let prevUpTo = -1;
    for (let i = 0; i < rules.brackets.length; i++) {
      const b = rules.brackets[i];
      if (b.rate === null || typeof b.rate !== 'number' || b.rate < 0) {
        errors.push(`อัตราภาษีขั้นบันไดที่ ${i + 1} ต้องไม่เป็น null และไม่ติดลบ`);
      }

      if (b.upTo !== null) {
        if (typeof b.upTo !== 'number' || b.upTo < 0) {
          errors.push(`ช่วงรายได้สูงสุดขั้นบันไดที่ ${i + 1} ต้องเป็นตัวเลขและไม่ติดลบ`);
        } else if (b.upTo <= prevUpTo) {
          errors.push(`ขั้นบันไดที่ ${i + 1} (${b.upTo}) ต้องมีค่ามากกว่าขั้นก่อนหน้า (${prevUpTo})`);
        }
        prevUpTo = b.upTo;
      }
    }
  } else {
    errors.push('ตารางขั้นบันได (brackets) ต้องเป็น Array');
  }

  const isOk = errors.length === 0;
  return {
    ok: isOk,
    valid: isOk,
    errors,
  };
}

/**
 * ดึงข้อมูลกฎภาษีของปีที่ระบุ (คืนค่าเป็น Deep Copy เสมอ)
 * @param {number|string} taxYear - ปีภาษีที่ต้องการดึงข้อมูล (เช่น 2569)
 * @returns {object} สำเนาข้อมูลกฎภาษีของปีนั้น
 * @throws {Error} กรณีไม่มีข้อมูลปีภาษีที่ระบุ หรือมีค่า null ในฟิลด์ที่จำเป็น
 */
export function getRules(taxYear = 2569) {
  const yearNum = Number(taxYear);
  const rawRules = rulesRegistry[yearNum];

  if (!rawRules) {
    throw new Error(`ไม่มีข้อมูลกฎภาษีของปี ${taxYear}`);
  }

  // ส่งคืนสำเนาแบบ Deep Copy เสมอ ป้องกันการแก้ไขต้นฉบับ
  const deepCopy = JSON.parse(JSON.stringify(rawRules));

  // ตรวจสอบความถูกต้องของกฎก่อนส่งคืน
  const validation = validateRules(deepCopy);
  if (!validation.ok) {
    throw new Error(`ข้อมูลกฎภาษีปี ${taxYear} ไม่ถูกต้อง: ${validation.errors.join(', ')}`);
  }

  return deepCopy;
}

/**
 * ลงทะเบียนกฎภาษีใหม่สำหรับปีอื่นๆ
 * @param {number} year - ปีภาษี
 * @param {object} rulesConfig - โครงสร้างกฎภาษี
 */
export function registerTaxRules(year, rulesConfig) {
  const yearNum = Number(year);
  rulesRegistry[yearNum] = rulesConfig;
}

/**
 * ดึงกฎภาษีแบบจัดรูปแบบให้โมดูลคำนวณใช้งาน (Backward compatibility)
 * @param {number|string} taxYear
 * @returns {object}
 */
export function getTaxRules(taxYear = 2569) {
  const rules = getRules(taxYear);

  // แปลงโครงสร้าง brackets ให้เข้ากับเอนจินคำนวณ (min, max, title, rate)
  const formattedBrackets = [];
  let prevMin = 0;

  for (const b of rules.brackets) {
    const maxVal = b.upTo !== null ? b.upTo : Infinity;
    const title =
      b.upTo !== null
        ? `${prevMin.toLocaleString('th-TH')} - ${maxVal.toLocaleString('th-TH')} บาท (${(b.rate * 100).toFixed(0)}%)`
        : `${prevMin.toLocaleString('th-TH')} บาทขึ้นไป (${(b.rate * 100).toFixed(0)}%)`;

    formattedBrackets.push({
      min: prevMin,
      max: maxVal,
      rate: b.rate,
      title,
    });

    if (b.upTo !== null) prevMin = b.upTo;
  }

  return {
    ...rules,
    expenses: {
      rate: rules.expenseDeduction.rate,
      maxAmount: rules.expenseDeduction.max,
    },
    basicAllowances: {
      personal: rules.personalAllowance,
      spouseNoIncome: rules.spouseAllowance,
      childGeneral: rules.childAllowance,
      childBorn2561Onwards: rules.childBirth2018Allowance + rules.childAllowance,
      parent: rules.parentAllowance,
      disabledDependent: rules.disabledAllowance,
    },
    caps: {
      socialSecurity: rules.caps.socialSecurity.annualMax || rules.caps.socialSecurity.monthlyMax * 12,
      lifeInsurance: rules.caps.lifeInsurance.max,
      healthInsurance: rules.caps.healthInsurance.max,
      combinedLifeAndHealth: rules.caps.lifeInsurance.max,
      parentHealthInsurance: rules.caps.parentHealthInsurance.max,
      pvdRateLimit: rules.caps.providentFund.percentOfIncome,
      rmfRateLimit: rules.caps.rmf.percentOfIncome,
      retirementGroupTotalCap: rules.caps.combinedRetirementCap.max,
      homeLoanInterest: rules.caps.homeLoanInterest.max,
      donationEducationRate: rules.caps.donationEducation.percentOfNetIncome || 0.10,
      donationGeneralRate: rules.caps.donationGeneral.percentOfNetIncome || 0.10,
      donationEducationMultiplier: rules.caps.donationEducation.multiplier || 2,
    },
    deadlines: {
      paperFilingDate: `31 มีนาคม ${rules.taxYear + 1}`,
      onlineFilingDate: `${rules.filing.filingDay} เมษายน ${rules.taxYear + 1}`,
      paymentDate: `${rules.filing.paymentDay} เมษายน ${rules.taxYear + 1}`,
      onlineFilingIsoDate: `${rules.taxYear - 543 + 1}-04-08T23:59:59+07:00`,
    },
    taxBrackets: formattedBrackets,
  };
}
