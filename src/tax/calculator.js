import { calculateTax } from '../calc/calculateTax.js';

export { calculateTax };

/**
 * คำนวณภาษีเงินได้บุคคลธรรมดา (ภ.ง.ด.91) - Aliased for backward compatibility
 * @param {object} input
 * @returns {object}
 */
export function calculatePnd91(input = {}) {
  const result = calculateTax(input);

  // Map breakdown items for legacy test compatibility
  const legacyBreakdown = result.deductionBreakdown.map((item) => ({
    ...item,
    name: item.name || item.label,
    actualAllowed: item.applied,
    cap: item.remainingCap !== null ? item.applied + item.remainingCap : null,
  }));

  return {
    ...result,
    deductionBreakdown: legacyBreakdown,
  };
}
