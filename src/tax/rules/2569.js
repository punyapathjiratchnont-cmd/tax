/**
 * กฎและเพดานภาษีเงินได้บุคคลธรรมดา (ภ.ง.ด.91) ประจำปีภาษี 2569
 * 
 * แหล่งที่มาอ้างอิง:
 * - ประมวลรัษฎากร กรมสรรพากร (https://www.rd.go.th)
 * - คู่มือการคำนวณภาษีเงินได้บุคคลธรรมดาสำหรับเงินเดือนประจำ
 * 
 * ⚠️ หมายเหตุสำคัญ:
 * TODO: ตรวจสอบกับกรมสรรพากรและประกาศในราชกิจจานุเบกษาก่อนใช้งานจริงในระบบการยื่นแบบทางราชการ
 */

const rules2569 = {
  taxYear: 2569,
  source: "ประมวลรัษฎากร และประกาศกรมสรรพากรเกี่ยวกับการคำนวณภาษีเงินได้บุคคลธรรมดา ภ.ง.ด.91",
  verifiedAt: null, // TODO: ตรวจสอบกับกรมสรรพากร (เป็น null จนกว่าจะตรวจสอบกับฉบับจริง)

  // อัตราภาษีขั้นบันได
  brackets: [
    { upTo: 150000, rate: 0.00 },  // TODO: ตรวจสอบยกเว้น 1.5 แสนแรก
    { upTo: 300000, rate: 0.05 },
    { upTo: 500000, rate: 0.10 },
    { upTo: 750000, rate: 0.15 },
    { upTo: 1000000, rate: 0.20 },
    { upTo: 2000000, rate: 0.25 },
    { upTo: 5000000, rate: 0.30 },
    { upTo: null, rate: 0.35 }    // null หมายถึง ไม่จำกัดเพดานขั้นสูงสุด (5 ล้านบาทขึ้นไป)
  ],

  // หักค่าใช้จ่ายเหมา 50% ไม่เกิน 100,000 บาท
  expenseDeduction: {
    rate: 0.5,
    max: 100000
  },

  // ค่าลดหย่อนพื้นฐาน (บาท)
  personalAllowance: 60000,
  spouseAllowance: 60000,
  childAllowance: 30000,
  childBirth2018Allowance: 30000, // บุตรที่เกิดปี 2561 ขึ้นไป ได้เพิ่มอีก 30,000 (รวมเป็น 60,000)
  parentAllowance: 30000,
  disabledAllowance: 60000,

  // เพดานค่าลดหย่อนประเภทต่างๆ
  caps: {
    lifeInsurance: { max: 100000 },
    healthInsurance: { max: 25000 },
    parentHealthInsurance: { max: 15000 },
    rmf: { max: 500000, percentOfIncome: 0.30 },
    providentFund: { max: 500000, percentOfIncome: 0.15 },
    socialSecurity: { monthlyMax: 750, annualMax: 9000 },
    combinedRetirementCap: { max: 500000 }, // รวม RMF, PVD, กบข., กองทุนการออมแห่งชาติ ฯลฯ
    homeLoanInterest: { max: 100000 },
    donationGeneral: { percentOfNetIncome: 0.10 },
    donationEducation: { multiplier: 2, percentOfNetIncome: 0.10 }
  },

  // กำหนดการยื่นและชำระภาษี
  filing: {
    filingMonth: 4,      // เมษายน
    filingDay: 8,        // 8 เมษายน (สำหรับการยื่นออนไลน์)
    paymentMonth: 4,
    paymentDay: 8
  },

  installmentThreshold: 3000, // ยอดภาษีเกิน 3,000 บาท ผ่อนชำระได้ 3 งวด
  urgentDays: 30              // แจ้งเตือนด่วนภายใน 30 วันก่อนถึงกำหนด
};

export default rules2569;
