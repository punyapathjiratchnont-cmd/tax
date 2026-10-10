import rule2569 from './2569.js';

const rulesRegistry = {
  2569: rule2569,
  2026: rule2569, // Alias for AD year
};

/**
 * ดึงข้อมูลกฎภาษีตามปีภาษีที่ระบุ
 * @param {number|string} year - ปีภาษี (เช่น 2569 หรือ 2026)
 * @returns {object} กฎและเพดานอัตราภาษีของปีนั้น
 * @throws {Error} กรณีไม่พบข้อมูลกฎสำหรับปีที่ระบุ
 */
export function getTaxRules(year = 2569) {
  const numericYear = Number(year);
  const rules = rulesRegistry[numericYear];

  if (!rules) {
    throw new Error(
      `ไม่พบข้อมูลกฎภาษีสำหรับปีภาษี ${year} (รองรับเฉพาะปี: ${Object.keys(rulesRegistry).join(', ')})`
    );
  }

  return rules;
}

/**
 * ลงทะเบียนกฎภาษีใหม่สำหรับปีอื่นๆ เพิ่มเติมโดยไม่ต้องแก้โค้ดคำนวณหลัก
 * @param {number} year - ปีภาษี
 * @param {object} rulesConfig - โครงสร้างกฎภาษี
 */
export function registerTaxRules(year, rulesConfig) {
  rulesRegistry[Number(year)] = rulesConfig;
}
