/**
 * กฎและเพดานภาษีเงินได้บุคคลธรรมดา (ภ.ง.ด.91) ประจำปีภาษี 2569
 * 
 * แหล่งที่มาอ้างอิง:
 * - ประมวลรัษฎากร กรมสรรพากร (https://www.rd.go.th)
 * 
 * ⚠️ หมายเหตุสำคัญ:
 * ข้อมูลกฎและเพดานภาษีนี้อ้างอิงตามโครงสร้างประกาศกรมสรรพากร
 * ต้องตรวจสอบอัตราและหลักเกณฑ์ล่าสุดกับกรมสรรพากรก่อนใช้งานจริง
 */

export default {
  taxYear: 2569,
  source: 'กรมสรรพากร (https://www.rd.go.th) - โครงสร้างอัตราภาษีปี 2569',
  disclaimer: 'ต้องตรวจสอบกับกรมสรรพากรก่อนใช้งานจริง',

  // ค่าใช้จ่ายเหมา 50% ของเงินได้จากเงินเดือน ไม่เกิน 100,000 บาท
  expenses: {
    rate: 0.50,
    maxAmount: 100000,
  },

  // ค่าลดหย่อนพื้นฐาน
  basicAllowances: {
    personal: 60000,
    spouseNoIncome: 60000,
    childGeneral: 30000,
    childBorn2561Onwards: 60000,
    parent: 30000,
    disabledDependent: 60000,
  },

  // เพดานค่าลดหย่อนประเภทต่างๆ
  caps: {
    socialSecurity: 9000,
    lifeInsurance: 100000,
    healthInsurance: 25000,
    combinedLifeAndHealth: 100000,
    parentHealthInsurance: 15000,
    pvdRateLimit: 0.15, // 15% ของเงินได้
    rmfRateLimit: 0.30, // 30% ของเงินได้
    retirementGroupTotalCap: 500000, // เพดานรวมกลุ่มเกษียณ (PVD + กบข. + RMF ฯลฯ)
    homeLoanInterest: 100000,
    donationEducationRate: 0.10, // 10% ของเงินได้หลังหักค่าใช้จ่ายและลดหย่อน
    donationGeneralRate: 0.10,
    donationEducationMultiplier: 2, // หักได้ 2 เท่า
  },

  // ตารางอัตราภาษีแบบก้าวหน้า ปี 2569
  taxBrackets: [
    { min: 0, max: 150000, rate: 0.00, title: '0 - 150,000 บาท (ได้รับการยกเว้น)' },
    { min: 150000, max: 300000, rate: 0.05, title: '150,001 - 300,000 บาท (5%)' },
    { min: 300000, max: 500000, rate: 0.10, title: '300,001 - 500,000 บาท (10%)' },
    { min: 500000, max: 750000, rate: 0.15, title: '500,001 - 750,000 บาท (15%)' },
    { min: 750000, max: 1000000, rate: 0.20, title: '750,001 - 1,000,000 บาท (20%)' },
    { min: 1000000, max: 2000000, rate: 0.25, title: '1,000,001 - 2,000,000 บาท (25%)' },
    { min: 2000000, max: 5000000, rate: 0.30, title: '2,000,001 - 5,000,000 บาท (30%)' },
    { min: 5000000, max: Infinity, rate: 0.35, title: '5,000,000 บาทขึ้นไป (35%)' },
  ],
};
