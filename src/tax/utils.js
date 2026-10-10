/**
 * ปัดเศษตัวเลขให้เป็นทศนิยมไม่เกิน 2 ตำแหน่งอย่างสม่ำเสมอ
 * @param {number} value
 * @returns {number}
 */
export function round2(value) {
  if (typeof value !== 'number' || isNaN(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * รวมค่านำเข้าไม่ว่าจะเป็นตัวเลขเดี่ยว หรืออาร์เรย์ของตัวเลข
 * @param {number|number[]} input
 * @returns {number}
 */
export function sumAmount(input) {
  if (Array.isArray(input)) {
    return round2(input.reduce((acc, curr) => acc + (Number(curr) || 0), 0));
  }
  return round2(Number(input) || 0);
}
