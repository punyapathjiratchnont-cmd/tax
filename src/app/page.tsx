'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { calculatePnd91 } from '../tax/index.js'
import TaxResultView, { TaxResultData } from './components/TaxResultView'
import TaxLawComplianceView from './components/TaxLawComplianceView'
import CrtHero from './components/CrtHero'
import { StepHead, Stepper, Segmented, Counter, CapBar, LiveSummary } from './components/CalcUi'
import ScrollExplainer from './components/ScrollExplainer'
import ClosingCta from './components/ClosingCta'
import TaxDeductionGuideView from './components/TaxDeductionGuideView'

// Interface definitions
interface CustomDeduction {
  id: string
  name: string
  amount: number
}

interface TaxWithheldRow {
  id: string
  source: string
  amount: number
}

interface FormState {
  taxYear: number
  maritalStatus: 'single' | 'married'
  spouseHasNoIncome: boolean
  childrenGeneral: number
  childrenBorn2561Onwards: number
  parentsSupported: number
  disabledDependents: number

  salaryMode: 'yearly' | 'monthly'
  monthlySalaries: number[]
  salaryYearly: number
  bonus: number
  otherSalaryIncome: number
  exemptIncome: number

  socialSecurity: number
  providentFund: number
  otherFunds: number

  deductions: {
    lifeInsurance: number
    healthInsurance: number
    parentHealthInsurance: number
    rmf: number
    donationEducation: number
    donationGeneral: number
    homeLoanInterest: number
    customDeductions: CustomDeduction[]
  }

  withheldRows: TaxWithheldRow[]
}

const DEMO_FORM_STATE: FormState = {
  taxYear: 2569,
  maritalStatus: 'single',
  spouseHasNoIncome: false,
  childrenGeneral: 0,
  childrenBorn2561Onwards: 0,
  parentsSupported: 0,
  disabledDependents: 0,

  salaryMode: 'yearly',
  monthlySalaries: Array(12).fill(45000),
  salaryYearly: 540000,
  bonus: 90000,
  otherSalaryIncome: 0,
  exemptIncome: 0,

  socialSecurity: 9000,
  providentFund: 27000,
  otherFunds: 0,

  deductions: {
    lifeInsurance: 30000,
    healthInsurance: 15000,
    parentHealthInsurance: 0,
    rmf: 20000,
    donationEducation: 0,
    donationGeneral: 0,
    homeLoanInterest: 25000,
    customDeductions: [],
  },

  withheldRows: [{ id: '1', source: 'บริษัท/นายจ้างหลัก', amount: 22000 }],
}

const INITIAL_FORM_STATE: FormState = {
  taxYear: 2569,
  maritalStatus: 'single',
  spouseHasNoIncome: false,
  childrenGeneral: 0,
  childrenBorn2561Onwards: 0,
  parentsSupported: 0,
  disabledDependents: 0,

  salaryMode: 'yearly',
  monthlySalaries: Array(12).fill(0),
  salaryYearly: 0,
  bonus: 0,
  otherSalaryIncome: 0,
  exemptIncome: 0,

  socialSecurity: 0,
  providentFund: 0,
  otherFunds: 0,

  deductions: {
    lifeInsurance: 0,
    healthInsurance: 0,
    parentHealthInsurance: 0,
    rmf: 0,
    donationEducation: 0,
    donationGeneral: 0,
    homeLoanInterest: 0,
    customDeductions: [],
  },

  withheldRows: [{ id: '1', source: 'บริษัท/นายจ้างหลัก', amount: 0 }],
}

const STEP_TITLES = [
  'ข้อมูลทั่วไป',
  'เงินเดือนและโบนัส',
  'เงินสมทบและกองทุน',
  'ค่าลดหย่อน',
  'ภาษีที่หักไว้แล้ว',
  'สรุปก่อนคำนวณ',
]

const MONTH_NAMES = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
]

export default function TaxPage() {
  const [activeMainTab, setActiveMainTab] = useState<'calculator' | 'law' | 'deductionGuide'>('calculator')
  const [step, setStep] = useState<number>(1)
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE)
  const [calcResult, setCalcResult] = useState<TaxResultData | null>(null)
  const [rawPayload, setRawPayload] = useState<unknown>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Ensure storage is cleared whenever page opens or reloads
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.clear()
        localStorage.clear()
      } catch {
        // Storage access handled
      }
    }
  }, [])

  // Effective total salary calculation
  const effectiveSalary = useMemo(() => {
    if (formData.salaryMode === 'monthly') {
      return formData.monthlySalaries.reduce((acc, curr) => acc + (Number(curr) || 0), 0)
    }
    return Number(formData.salaryYearly) || 0
  }, [formData.salaryMode, formData.monthlySalaries, formData.salaryYearly])

  // Gross income calculation for live caps
  const grossIncome = useMemo(() => {
    return effectiveSalary + (Number(formData.bonus) || 0) + (Number(formData.otherSalaryIncome) || 0)
  }, [effectiveSalary, formData.bonus, formData.otherSalaryIncome])

  // Total withheld tax sum
  const totalTaxWithheld = useMemo(() => {
    return formData.withheldRows.reduce((acc, row) => acc + (Number(row.amount) || 0), 0)
  }, [formData.withheldRows])

  // Field updater
  const updateField = (path: string, val: unknown) => {
    setValidationError(null)
    setFormData((prev) => {
      const copy = JSON.parse(JSON.stringify(prev))
      const keys = path.split('.')
      let curr = copy
      for (let i = 0; i < keys.length - 1; i++) {
        curr = curr[keys[i]]
      }
      curr[keys[keys.length - 1]] = val
      return copy
    })
  }

  // Monthly salary updater
  const handleMonthlyChange = (index: number, val: number) => {
    setValidationError(null)
    const updated = [...formData.monthlySalaries]
    updated[index] = Math.max(0, Number(val) || 0)
    setFormData((prev) => ({ ...prev, monthlySalaries: updated }))
  }

  // The calculator/guide area stays hidden until the visitor presses a start button
  const [unlocked, setUnlocked] = useState(false)
  const [scrollTick, setScrollTick] = useState(0)

  useEffect(() => {
    if (!scrollTick) return
    document.getElementById('main-content-section')?.scrollIntoView({ behavior: 'smooth' })
  }, [scrollTick])

  // Unlock the main area, switch tab and scroll to it once it has rendered
  const scrollToForm = (tabName: 'calculator' | 'law' | 'deductionGuide' = 'calculator') => {
    setActiveMainTab(tabName)
    setUnlocked(true)
    setScrollTick((t) => t + 1)
  }

  // Step validation
  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!formData.taxYear || formData.taxYear < 2500) {
        setValidationError('กรุณากรอกปีภาษีให้ถูกต้อง')
        return false
      }
    } else if (currentStep === 2) {
      if (effectiveSalary <= 0) {
        setValidationError('กรุณากรอกเงินเดือนประจำให้มากกว่า 0')
        return false
      }
    }
    setValidationError(null)
    return true
  }

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 6) setStep(step + 1)
    }
  }

  const handleBack = () => {
    setValidationError(null)
    if (step > 1) setStep(step - 1)
  }

  // Run calculation
  const buildPayload = () => {
    const payload = {
      taxYear: formData.taxYear,
      salary: effectiveSalary,
      bonus: Number(formData.bonus) || 0,
      otherSalaryIncome: Number(formData.otherSalaryIncome) || 0,
      exemptIncome: Number(formData.exemptIncome) || 0,
      socialSecurity: Number(formData.socialSecurity) || 0,
      providentFund: Number(formData.providentFund) || 0,
      otherFunds: Number(formData.otherFunds) || 0,
      maritalStatus: formData.maritalStatus,
      spouseHasNoIncome: formData.spouseHasNoIncome,
      children: {
        general: Number(formData.childrenGeneral) || 0,
        born2561Onwards: Number(formData.childrenBorn2561Onwards) || 0,
      },
      parentsSupported: Number(formData.parentsSupported) || 0,
      disabledDependents: Number(formData.disabledDependents) || 0,
      deductions: {
        lifeInsurance: Number(formData.deductions.lifeInsurance) || 0,
        healthInsurance: Number(formData.deductions.healthInsurance) || 0,
        parentHealthInsurance: Number(formData.deductions.parentHealthInsurance) || 0,
        rmf: Number(formData.deductions.rmf) || 0,
        donationEducation: Number(formData.deductions.donationEducation) || 0,
        donationGeneral: Number(formData.deductions.donationGeneral) || 0,
        homeLoanInterest: Number(formData.deductions.homeLoanInterest) || 0,
        customDeductions: formData.deductions.customDeductions.map((c) => ({
          name: c.name,
          amount: Number(c.amount) || 0,
        })),
      },
      taxAlreadyWithheld: totalTaxWithheld,
    }
    return payload
  }

  // Live estimate for the side receipt (pure and cheap, so recomputed on every render)
  let liveResult: TaxResultData | null = null
  try {
    liveResult = calculatePnd91(buildPayload()) as TaxResultData
  } catch {
    liveResult = null
  }

  const handleCalculateTax = () => {
    const payload = buildPayload()

    try {
      const output = calculatePnd91(payload) as TaxResultData
      setRawPayload(payload)
      setCalcResult(output)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-[#060b07] text-white font-sans flex flex-col justify-between">
      {/* TOP NAVBAR */}
      <header className="fixed inset-x-0 top-0 z-30 px-3 sm:px-6 pt-3">
        <nav className="nav-glass mx-auto max-w-5xl flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[2rem] sm:rounded-full pl-5 pr-2.5 py-2.5">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 text-white font-bold tracking-[0.2em] text-sm"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#bef264" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z" />
              <path d="M2 21c0-3 1.9-5.4 5.1-6.4C9.3 13.9 12 13 14 11" />
            </svg>
            TAX
          </button>

          <div className="order-last sm:order-none w-full sm:w-auto flex items-center justify-center gap-1 sm:gap-3 text-[13px]">
            {([
              ['calculator', 'คำนวณภาษี'],
              ['law', 'กฎหมายภาษี'],
              ['deductionGuide', 'คำแนะนำลดหย่อน'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => scrollToForm(key)}
                className={`relative px-3 sm:px-4 py-2 transition-colors ${
                  activeMainTab === key ? 'text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                {label}
                {activeMainTab === key && (
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-1 h-1 rounded-full bg-lime-300" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFormData(INITIAL_FORM_STATE)
                setCalcResult(null)
                setRawPayload(null)
                setStep(1)
                setValidationError(null)
              }}
              className="hidden sm:inline-flex px-4 py-1.5 rounded-full border border-white/20 text-white/90 text-[13px] hover:bg-white/10 transition-colors"
            >
              ล้างข้อมูล
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData(DEMO_FORM_STATE)
                setCalcResult(null)
                setRawPayload(null)
                setStep(1)
                setValidationError(null)
              }}
              className="hidden md:inline-flex px-4 py-1.5 rounded-full border border-lime-400/30 text-lime-300 text-[13px] hover:bg-lime-400/10 transition-colors"
            >
              ลองตัวอย่าง
            </button>
            <button
              type="button"
              onClick={() => scrollToForm('calculator')}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-lime-200 to-lime-300 text-slate-900 text-[13px] font-semibold hover:brightness-105 active:scale-95 transition"
            >
              เริ่มคำนวณ <span aria-hidden="true">→</span>
            </button>
          </div>
        </nav>
      </header>

      {/* HERO: CRT monitor, zooms in on scroll */}
      <CrtHero
        onStart={() => scrollToForm('calculator')}
        onGuide={() => scrollToForm('deductionGuide')}
      />
      <ScrollExplainer onStart={() => scrollToForm('calculator')} />
      <ClosingCta onStart={() => scrollToForm('calculator')} onGuide={() => scrollToForm('deductionGuide')} />

      {/* MAIN CONTENT & STANDALONE MODULE SECTION */}
      {unlocked && (
      <div className="content-bg">
      <section id="main-content-section" className={`scroll-mt-24 py-16 px-4 sm:px-6 mx-auto w-full max-w-5xl`}>
        {activeMainTab === 'calculator' && (
          <div className="mb-8 text-center animate-fade-in">
            <p className="section-eyebrow">{'C:\\TAX\\CALC>'}</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white">คำนวณภาษีทีละขั้นตอน</h2>
          </div>
        )}
        {/* RENDER ACTIVE TAB CONTENT */}
        {activeMainTab === 'law' && <TaxLawComplianceView onCalculate={() => scrollToForm('calculator')} />}
        {activeMainTab === 'deductionGuide' && <TaxDeductionGuideView onCalculate={() => scrollToForm('calculator')} />}

        {activeMainTab === 'calculator' && (
          <div>
            {/* Wizard Progress */}
            <Stepper
              step={step}
              titles={STEP_TITLES}
              onGo={(n) => {
                if (validateStep(step)) {
                  setStep(n)
                  if (calcResult) setCalcResult(null)
                }
              }}
            />

            <div className={`cx-grid ${calcResult ? 'solo' : ''}`}>
            <div className="min-w-0">
        {/* Validation Error Banner */}
        {validationError && (
          <div className="p-3 mb-6 bg-white/[0.06] border-l-4 border-amber-500 bg-amber-400/10 text-xs font-bold text-white animate-fade-in">
            ⚠️ {validationError}
          </div>
        )}

        {/* Form Content Card */}
        <div className="cx-card">
          {/* STEP 1: GENERAL INFO */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <StepHead no="01" title="ข้อมูลทั่วไป" sub="ระบุปีภาษีและสิทธิลดหย่อนตามสถานะครอบครัว (ไม่ต้องกรอกชื่อหรือเลขบัตร)" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">ปีภาษี</label>
                  <input
                    type="number"
                    value={formData.taxYear}
                    onChange={(e) => updateField('taxYear', Number(e.target.value))}
                    className="w-full border border-white/10 rounded-xl p-2.5 text-sm font-mono-num font-bold focus:outline-none focus:ring-2 focus:ring-lime-300"
                  />
                </div>

                <Segmented
                  label="สถานะการสมรส"
                  value={formData.maritalStatus}
                  onChange={(v) => updateField('maritalStatus', v)}
                  options={[
                    { value: 'single' as const, label: 'โสด', icon: <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1" /> },
                    { value: 'married' as const, label: 'สมรส', icon: <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" /> },
                  ]}
                />
              </div>

              {formData.maritalStatus === 'married' && (
                <div className="p-3.5 bg-white/[0.03] border border-white/10 rounded-xl">
                  <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.spouseHasNoIncome}
                      onChange={(e) => updateField('spouseHasNoIncome', e.target.checked)}
                      className="w-4 h-4 accent-lime-400 border border-white/10 rounded"
                    />
                    คู่สมรสไม่มีเงินได้ในปีภาษานี้
                  </label>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <Counter label="จำนวนบุตรที่มีสิทธิ์" value={formData.childrenGeneral} max={20} onChange={(v) => updateField('childrenGeneral', v)} icon={<><circle cx="12" cy="8" r="3.2" /><path d="M5.5 20a6.5 6.5 0 0113 0" /></>} />

                <Counter label="บุตรเกิดปี 2561 ขึ้นไป" value={formData.childrenBorn2561Onwards} max={20} onChange={(v) => updateField('childrenBorn2561Onwards', v)} icon={<><circle cx="12" cy="9" r="3" /><path d="M6 20a6 6 0 0112 0M10 4l2-2 2 2" /></>} />

                <Counter label="บิดามารดาที่อุปการะ" value={formData.parentsSupported} max={4} onChange={(v) => updateField('parentsSupported', v)} icon={<><circle cx="8" cy="8" r="3" /><circle cx="17" cy="9" r="2.4" /><path d="M2.5 20a5.5 5.5 0 0111 0M14.5 20a4.5 4.5 0 017 0" /></>} />

                <Counter label="ผู้พิการในอุปการะ" value={formData.disabledDependents} max={20} onChange={(v) => updateField('disabledDependents', v)} icon={<><circle cx="10" cy="5" r="2" /><path d="M10 8v6h6l2 5M10 11H6M7 20a4 4 0 004-4" /></>} />
              </div>
            </div>
          )}

          {/* STEP 2: SALARY & BONUS */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <StepHead no="02" title="เงินเดือนและโบนัส" sub="ระบุรายได้จากเงินเดือนประจำตามมาตรา 40(1)" />

              <div className="flex border border-white/10 rounded-xl p-1 bg-white/[0.03] max-w-sm">
                <button
                  type="button"
                  onClick={() => updateField('salaryMode', 'yearly')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                    formData.salaryMode === 'yearly' ? 'bg-lime-300 text-[#07120a]' : 'text-white/65'
                  }`}
                >
                  เหมาสรุปรายปี
                </button>
                <button
                  type="button"
                  onClick={() => updateField('salaryMode', 'monthly')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                    formData.salaryMode === 'monthly' ? 'bg-lime-300 text-[#07120a]' : 'text-white/65'
                  }`}
                >
                  กรอก 12 เดือน
                </button>
              </div>

              {formData.salaryMode === 'yearly' ? (
                <div>
                  <label className="block text-xs font-bold mb-1">เงินเดือนรวมทั้งปี (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.salaryYearly}
                    onChange={(e) => updateField('salaryYearly', Math.max(0, Number(e.target.value)))}
                    className="w-full border border-white/10 rounded-xl p-2.5 text-sm font-mono-num font-bold"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-bold">เงินเดือนแยก 12 ช่อง:</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {MONTH_NAMES.map((mName, idx) => (
                      <div key={idx}>
                        <span className="text-[10px] font-bold block text-white/50">{mName}</span>
                        <input
                          type="number"
                          min="0"
                          value={formData.monthlySalaries[idx]}
                          onChange={(e) => handleMonthlyChange(idx, Number(e.target.value))}
                          className="w-full border border-white/10 rounded p-1.5 text-xs font-mono-num"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="p-2.5 bg-white/[0.06] border border-white/10 rounded-xl flex justify-between text-xs font-bold">
                    <span>รวมเงินเดือน 12 เดือน:</span>
                    <span className="font-mono-num">฿{effectiveSalary.toLocaleString('th-TH')}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold mb-1">โบนัส (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.bonus}
                    onChange={(e) => updateField('bonus', Math.max(0, Number(e.target.value)))}
                    className="w-full border border-white/10 rounded-xl p-2.5 text-sm font-mono-num"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">เงินได้อื่นที่เป็นเงินเดือน</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.otherSalaryIncome}
                    onChange={(e) => updateField('otherSalaryIncome', Math.max(0, Number(e.target.value)))}
                    className="w-full border border-white/10 rounded-xl p-2.5 text-sm font-mono-num"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">เงินได้ยกเว้น</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.exemptIncome}
                    onChange={(e) => updateField('exemptIncome', Math.max(0, Number(e.target.value)))}
                    className="w-full border border-white/10 rounded-xl p-2.5 text-sm font-mono-num"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SOCIAL SECURITY & FUNDS */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <StepHead no="03" title="เงินสมทบและกองทุน" sub="ระบุเงินประกันสังคม กองทุนสำรองเลี้ยงชีพ และกองทุนอื่น" />

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold">ประกันสังคมทั้งปี (บาท)</label>
                  <span className="text-[10px] font-bold text-white/65 border border-white/10 px-2 py-0.5 rounded bg-white/[0.03]">
                    เพดาน: 750 บาท/เดือน (9,000 บาท/ปี)
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={formData.socialSecurity}
                  onChange={(e) => updateField('socialSecurity', Math.max(0, Number(e.target.value)))}
                  className="w-full border border-white/10 rounded-xl p-2.5 text-sm font-mono-num"
                />
                <CapBar value={formData.socialSecurity} cap={9000} />
                              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold">กองทุนสำรองเลี้ยงชีพ (PVD) (บาท)</label>
                  <span className="text-[10px] font-bold text-white/65 border border-white/10 px-2 py-0.5 rounded bg-white/[0.03]">
                    เพดาน: ไม่เกิน 15% ของเงินได้
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={formData.providentFund}
                  onChange={(e) => updateField('providentFund', Math.max(0, Number(e.target.value)))}
                  className="w-full border border-white/10 rounded-xl p-2.5 text-sm font-mono-num"
                />
                <CapBar value={formData.providentFund} cap={Math.round(grossIncome * 0.15)} />
                              </div>

              <div>
                <label className="block text-xs font-bold mb-1">
                  กบข. หรือกองทุนอื่นที่หักจากเงินเดือน (บาท)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.otherFunds}
                  onChange={(e) => updateField('otherFunds', Math.max(0, Number(e.target.value)))}
                  className="w-full border border-white/10 rounded-xl p-2.5 text-sm font-mono-num"
                />
              </div>
            </div>
          )}

          {/* STEP 4: DEDUCTIONS */}
          {step === 4 && (
            <div className="space-y-5 animate-fade-in">
              <StepHead no="04" title="ค่าลดหย่อน" sub="เลือกปุ่มยอดพบบ่อยหรือพิมพ์เอง แสดงเพดานคงเหลือทันที" />

              {/* Life Insurance */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold">ประกันชีวิต (บาท)</label>
                  <span className="text-[11px] font-mono-num text-white/50">
                    เพดานคงเหลือ: ฿{Math.max(0, 100000 - formData.deductions.lifeInsurance).toLocaleString('th-TH')}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={formData.deductions.lifeInsurance}
                  onChange={(e) => updateField('deductions.lifeInsurance', Math.max(0, Number(e.target.value)))}
                  className="w-full border border-white/10 rounded-xl p-2.5 text-sm font-mono-num mb-1.5"
                />
                <CapBar value={formData.deductions.lifeInsurance} cap={100000} />
                <div className="flex gap-1.5 flex-wrap">
                  {[10000, 30000, 50000, 100000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => updateField('deductions.lifeInsurance', amt)}
                      className="text-[11px] font-bold px-2.5 py-1 border border-white/10 rounded bg-white/[0.03] hover:bg-lime-300 hover:text-[#07120a] hover:border-lime-300 transition-all"
                    >
                      +{amt.toLocaleString('th-TH')}
                    </button>
                  ))}
                </div>
                              </div>

              {/* Health Insurance */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold">ประกันสุขภาพ (บาท)</label>
                  <span className="text-[11px] font-mono-num text-white/50">
                    เพดานคงเหลือ: ฿{Math.max(0, 25000 - formData.deductions.healthInsurance).toLocaleString('th-TH')}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={formData.deductions.healthInsurance}
                  onChange={(e) => updateField('deductions.healthInsurance', Math.max(0, Number(e.target.value)))}
                  className="w-full border border-white/10 rounded-xl p-2.5 text-sm font-mono-num mb-1.5"
                />
                <CapBar value={formData.deductions.healthInsurance} cap={25000} />
                <div className="flex gap-1.5 flex-wrap">
                  {[5000, 15000, 25000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => updateField('deductions.healthInsurance', amt)}
                      className="text-[11px] font-bold px-2.5 py-1 border border-white/10 rounded bg-white/[0.03] hover:bg-lime-300 hover:text-[#07120a] hover:border-lime-300 transition-all"
                    >
                      +{amt.toLocaleString('th-TH')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parent Health Insurance */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold">ประกันสุขภาพบิดามารดา (บาท)</label>
                  <span className="text-[11px] text-white/50">เพดาน: 15,000 บาท</span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={formData.deductions.parentHealthInsurance}
                  onChange={(e) => updateField('deductions.parentHealthInsurance', Math.max(0, Number(e.target.value)))}
                  className="w-full border border-white/10 rounded-xl p-2.5 text-sm font-mono-num"
                />
                <CapBar value={formData.deductions.parentHealthInsurance} cap={15000} />
              </div>

              {/* RMF */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold">RMF (บาท)</label>
                  <span className="text-[11px] text-white/50">เพดาน: ไม่เกิน 30% ของเงินได้</span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={formData.deductions.rmf}
                  onChange={(e) => updateField('deductions.rmf', Math.max(0, Number(e.target.value)))}
                  className="w-full border border-white/10 rounded-xl p-2.5 text-sm font-mono-num mb-1.5"
                />
                <CapBar value={formData.deductions.rmf} cap={Math.round(grossIncome * 0.3)} />
                <div className="flex gap-1.5 flex-wrap">
                  {[10000, 30000, 50000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => updateField('deductions.rmf', amt)}
                      className="text-[11px] font-bold px-2.5 py-1 border border-white/10 rounded bg-white/[0.03] hover:bg-lime-300 hover:text-[#07120a] hover:border-lime-300 transition-all"
                    >
                      +{amt.toLocaleString('th-TH')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Home Loan Interest */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold">ดอกเบี้ยเงินกู้ที่อยู่อาศัย (บาท)</label>
                  <span className="text-[11px] font-mono-num text-white/50">
                    เพดานคงเหลือ: ฿{Math.max(0, 100000 - formData.deductions.homeLoanInterest).toLocaleString('th-TH')}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={formData.deductions.homeLoanInterest}
                  onChange={(e) => updateField('deductions.homeLoanInterest', Math.max(0, Number(e.target.value)))}
                  className="w-full border border-white/10 rounded-xl p-2.5 text-sm font-mono-num mb-1.5"
                />
                <CapBar value={formData.deductions.homeLoanInterest} cap={100000} />
              </div>

              {/* Donations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">บริจาคการศึกษา (2 เท่า)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.deductions.donationEducation}
                    onChange={(e) => updateField('deductions.donationEducation', Math.max(0, Number(e.target.value)))}
                    className="w-full border border-white/10 rounded-xl p-2.5 text-sm font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">บริจาคทั่วไป (1 เท่า)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.deductions.donationGeneral}
                    onChange={(e) => updateField('deductions.donationGeneral', Math.max(0, Number(e.target.value)))}
                    className="w-full border border-white/10 rounded-xl p-2.5 text-sm font-mono-num"
                  />
                </div>
              </div>

              {/* Custom Deductions */}
              <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold">รายการกำหนดเองเพิ่มเติม:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newItem: CustomDeduction = {
                        id: Date.now().toString(),
                        name: 'ลดหย่อนเพิ่มเติม',
                        amount: 5000,
                      }
                      updateField('deductions.customDeductions', [
                        ...formData.deductions.customDeductions,
                        newItem,
                      ])
                    }}
                    className="text-[11px] font-bold px-2.5 py-1 border border-white/10 rounded bg-[#0c1a11] hover:bg-lime-300 hover:text-[#07120a] hover:border-lime-300 transition-all"
                  >
                    + เพิ่มรายการ
                  </button>
                </div>

                {formData.deductions.customDeductions.map((item, idx) => (
                  <div key={item.id} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => {
                        const updated = [...formData.deductions.customDeductions]
                        updated[idx].name = e.target.value
                        updateField('deductions.customDeductions', updated)
                      }}
                      className="flex-1 border border-white/10 rounded p-1.5 text-xs"
                      placeholder="ชื่อรายการ"
                    />
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => {
                        const updated = [...formData.deductions.customDeductions]
                        updated[idx].amount = Math.max(0, Number(e.target.value))
                        updateField('deductions.customDeductions', updated)
                      }}
                      className="w-24 border border-white/10 rounded p-1.5 text-xs font-mono-num"
                      placeholder="จำนวนเงิน"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = formData.deductions.customDeductions.filter((_, i) => i !== idx)
                        updateField('deductions.customDeductions', updated)
                      }}
                      className="text-xs font-bold text-rose-400 px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: TAX WITHHELD */}
          {step === 5 && (
            <div className="space-y-5 animate-fade-in">
              <StepHead no="05" title="ภาษีที่หักไว้แล้ว" sub="ระบุภาษีที่นายจ้างหัก ณ ที่จ่ายไว้แล้ว สามารถเพิ่มแถวนายจ้างได้หลายแห่ง" />

              <div className="space-y-2">
                {formData.withheldRows.map((row, idx) => (
                  <div key={row.id} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={row.source}
                      onChange={(e) => {
                        const updated = [...formData.withheldRows]
                        updated[idx].source = e.target.value
                        setFormData((prev) => ({ ...prev, withheldRows: updated }))
                      }}
                      className="flex-1 border border-white/10 rounded-xl p-2.5 text-xs font-bold"
                      placeholder="ชื่อนายจ้าง / ที่ทำงาน"
                    />
                    <input
                      type="number"
                      min="0"
                      value={row.amount}
                      onChange={(e) => {
                        const updated = [...formData.withheldRows]
                        updated[idx].amount = Math.max(0, Number(e.target.value))
                        setFormData((prev) => ({ ...prev, withheldRows: updated }))
                      }}
                      className="w-32 border border-white/10 rounded-xl p-2.5 text-xs font-mono-num font-bold"
                      placeholder="ภาษีที่หักไว้ (บาท)"
                    />
                    {formData.withheldRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formData.withheldRows.filter((_, i) => i !== idx)
                          setFormData((prev) => ({ ...prev, withheldRows: updated }))
                        }}
                        className="text-xs font-bold text-rose-400 px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    const newRow: TaxWithheldRow = {
                      id: Date.now().toString(),
                      source: `แห่งที่ ${formData.withheldRows.length + 1}`,
                      amount: 0,
                    }
                    setFormData((prev) => ({
                      ...prev,
                      withheldRows: [...prev.withheldRows, newRow],
                    }))
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold border border-white/10 rounded-xl bg-white/[0.03] hover:bg-lime-300 hover:text-[#07120a] hover:border-lime-300 transition-all mt-2"
                >
                  + เพิ่มแถวนายจ้าง
                </button>

                <div className="p-3 bg-white/[0.06] border border-white/10 rounded-xl flex justify-between items-center mt-3">
                  <span className="text-xs font-bold">รวมภาษีหักไว้แล้วทั้งปี:</span>
                  <span className="font-mono-num font-bold text-sm">
                    ฿{totalTaxWithheld.toLocaleString('th-TH')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: SUMMARY & CALCULATE */}
          {step === 6 && (
            <div className="space-y-5 animate-fade-in">
              {!calcResult ? (
                <>
                  <StepHead no="06" title="สรุปก่อนคำนวณ" sub="ตรวจสอบค่าที่กรอกทั้งหมดก่อนคลิกคำนวณภาษี" />

                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 border border-white/10 rounded-xl bg-white/[0.03] flex justify-between items-center">
                      <div>
                        <span className="font-bold block">1. ข้อมูลทั่วไป:</span>
                        <span className="text-white/65">
                          ปีภาษี: {formData.taxYear} | สถานะ: {formData.maritalStatus} | บุตร: {formData.childrenGeneral + formData.childrenBorn2561Onwards} คน
                        </span>
                      </div>
                      <button onClick={() => setStep(1)} className="font-bold text-white underline">
                        แก้ไข
                      </button>
                    </div>

                    <div className="p-3 border border-white/10 rounded-xl bg-white/[0.03] flex justify-between items-center">
                      <div>
                        <span className="font-bold block">2. เงินเดือนและโบนัส:</span>
                        <span className="text-white/65">
                          เงินเดือน: ฿{effectiveSalary.toLocaleString('th-TH')} | โบนัส: ฿{formData.bonus.toLocaleString('th-TH')}
                        </span>
                      </div>
                      <button onClick={() => setStep(2)} className="font-bold text-white underline">
                        แก้ไข
                      </button>
                    </div>

                    <div className="p-3 border border-white/10 rounded-xl bg-white/[0.03] flex justify-between items-center">
                      <div>
                        <span className="font-bold block">3. เงินสมทบและกองทุน:</span>
                        <span className="text-white/65">
                          ประกันสังคม: ฿{formData.socialSecurity.toLocaleString('th-TH')} | PVD: ฿{formData.providentFund.toLocaleString('th-TH')}
                        </span>
                      </div>
                      <button onClick={() => setStep(3)} className="font-bold text-white underline">
                        แก้ไข
                      </button>
                    </div>

                    <div className="p-3 border border-white/10 rounded-xl bg-white/[0.03] flex justify-between items-center">
                      <div>
                        <span className="font-bold block">4. ค่าลดหย่อน:</span>
                        <span className="text-white/65">
                          ประกันชีวิต: ฿{formData.deductions.lifeInsurance.toLocaleString('th-TH')} | ดอกเบี้ยบ้าน: ฿{formData.deductions.homeLoanInterest.toLocaleString('th-TH')}
                        </span>
                      </div>
                      <button onClick={() => setStep(4)} className="font-bold text-white underline">
                        แก้ไข
                      </button>
                    </div>

                    <div className="p-3 border border-white/10 rounded-xl bg-white/[0.03] flex justify-between items-center">
                      <div>
                        <span className="font-bold block">5. ภาษีที่หักไว้แล้ว:</span>
                        <span className="text-white/65 font-bold">
                          รวม: ฿{totalTaxWithheld.toLocaleString('th-TH')}
                        </span>
                      </div>
                      <button onClick={() => setStep(5)} className="font-bold text-white underline">
                        แก้ไข
                      </button>
                    </div>
                  </div>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={handleCalculateTax}
                      className="w-full sm:w-auto px-8 py-3 text-sm font-bold bg-lime-300 text-[#07120a] rounded-full hover:bg-lime-200 transition-all shadow-md active:scale-95"
                    >
                      คำนวณภาษี
                    </button>
                  </div>
                </>
              ) : (
                /* FULL TAX RESULT VIEW */
                <TaxResultView
                  result={calcResult}
                  rawInput={rawPayload}
                  onEditData={() => {
                    setCalcResult(null)
                    setStep(1)
                  }}
                  onRecalculate={handleCalculateTax}
                />
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-4 border-t border-white/10">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2 text-xs font-bold border border-white/10 rounded-full bg-[#0c1a11] hover:bg-white/[0.06] transition-all"
              >
                ← ย้อนกลับ
              </button>
            ) : (
              <div />
            )}

            {step < 6 && (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 text-xs font-bold bg-lime-300 text-[#07120a] rounded-full hover:bg-lime-200 transition-all ml-auto"
              >
                ถัดไป →
              </button>
            )}
          </div>
        </div>
      </div>
      {!calcResult && <LiveSummary result={liveResult} />}
      </div>
      </div>
      )}
      </section>
      </div>
      )}

      {/* Mandatory Disclaimer Footer */}
      <footer className="text-center text-[11px] text-white/40 py-8 border-t border-white/10 bg-[#040805] font-mono-num tracking-wide">
        * ผลลัพธ์เป็นการประมาณการ ไม่ใช่การยื่นภาษีอย่างเป็นทางการ
      </footer>
    </div>
  )
}
