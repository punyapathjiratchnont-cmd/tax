'use client'

import React from 'react'

export interface TaxResultData {
  taxYear: number
  grossIncome: number
  taxableIncome: number
  expenseDeduction: number
  totalAllowances: number
  netIncome: number
  taxBrackets: Array<{
    title: string
    min: number
    max: number
    rate: number
    taxableInBracket: number
    taxInBracket: number
  }>
  taxCalculated: number
  taxWithheld: number
  amountDue: number
  deductionBreakdown: Array<{
    name: string
    requested: number
    actualAllowed: number
    cap: number | null
    remainingCap: number | null
  }>
  warnings: string[]
}

interface Props {
  result: TaxResultData
  rawInput?: unknown
  onEditData?: () => void
  onRecalculate?: () => void
}

/**
 * Format currency with commas and 2 decimal places
 */
export function fmtBaht(val: number): string {
  const num = typeof val === 'number' && !isNaN(val) ? val : 0
  return `฿${num.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export default function TaxResultView({ result, onEditData, onRecalculate }: Props) {
  if (!result) return null

  const {
    taxYear,
    grossIncome,
    expenseDeduction,
    totalAllowances,
    netIncome,
    taxCalculated,
    taxWithheld,
    amountDue,
  } = result

  return (
    <div className="w-full space-y-8 animate-fade-in">
      {/* 1. HERO RESULT CARD */}
      <div
        className={`result-hero relative overflow-hidden border rounded-xl p-6 sm:p-8 text-center space-y-3 ${
          amountDue > 0 ? 'result-due border-red-400/40' : 'result-refund border-lime-300/30'
        }`}
      >
        <span className="text-xs font-bold text-white/50 uppercase tracking-wider block font-mono-num">
          สรุปภาระภาษีปี {taxYear}
        </span>

        {/* Largest Number on Page */}
        <div
          className={`font-mono-num text-4xl sm:text-6xl font-black tracking-tight my-2 ${
            amountDue > 0 ? 'text-red-400' : 'text-lime-300'
          }`}
        >
          {fmtBaht(Math.abs(amountDue))}
        </div>

        {/* Badge Indicator */}
        <div className="inline-block">
          <span
            className={`px-4 py-1.5 rounded-full border text-xs sm:text-sm font-bold ${
              amountDue > 0
                ? 'border-red-400/40 bg-red-400/10 text-red-300'
                : 'border-lime-300/40 bg-lime-300/10 text-lime-200'
            }`}
          >
            {amountDue > 0
              ? 'ต้องชำระเพิ่ม'
              : amountDue < 0
              ? 'ได้รับคืน'
              : 'ไม่มียอดต้องชำระ'}
          </span>
        </div>
      </div>

      {/* 2. SUMMARY METRICS LIST */}
      <div className="border border-white/10 rounded-xl p-5 sm:p-6 bg-[#0c1a11] space-y-3">
        <h3 className="text-sm font-bold border-b border-white/10 pb-2 text-white">
          สรุปตัวเลขเงินได้และภาษี
        </h3>
        <div className="divide-y divide-white/10 text-xs sm:text-sm">
          <div className="py-2 flex justify-between items-center">
            <span className="text-white/65 font-medium">เงินได้รวม</span>
            <span className="font-mono-num font-bold">{fmtBaht(grossIncome)}</span>
          </div>
          <div className="py-2 flex justify-between items-center">
            <span className="text-white/65 font-medium">หักค่าใช้จ่ายเหมา</span>
            <span className="font-mono-num font-bold text-white/80">
              -{fmtBaht(expenseDeduction)}
            </span>
          </div>
          <div className="py-2 flex justify-between items-center">
            <span className="text-white/65 font-medium">ค่าลดหย่อนรวม</span>
            <span className="font-mono-num font-bold text-white/80">
              -{fmtBaht(totalAllowances)}
            </span>
          </div>
          <div className="py-2 flex justify-between items-center font-bold bg-white/[0.03] px-2 rounded">
            <span>เงินได้สุทธิ</span>
            <span className="font-mono-num">{fmtBaht(netIncome)}</span>
          </div>
          <div className="py-2 flex justify-between items-center">
            <span className="text-white/65 font-medium">ภาษีที่คำนวณได้</span>
            <span className="font-mono-num font-bold text-red-400">{fmtBaht(taxCalculated)}</span>
          </div>
          <div className="py-2 flex justify-between items-center">
            <span className="text-white/65 font-medium">ภาษีที่หักไว้แล้ว</span>
            <span className="font-mono-num font-bold text-white/80">
              -{fmtBaht(taxWithheld)}
            </span>
          </div>
        </div>
      </div>

      {/* DISCLAIMER */}
      <div className="text-center text-xs text-white/50 py-2 font-medium border-t border-white/10 pt-4">
        ผลลัพธ์นี้เป็นการประมาณการ ไม่ใช่การยื่นภาษีอย่างเป็นทางการ และไม่ใช่คำแนะนำทางกฎหมายหรือการเงิน
      </div>

      {/* BOTTOM ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
        {onEditData && (
          <button
            type="button"
            onClick={onEditData}
            className="px-6 py-2.5 border border-white/10 rounded-full font-bold text-xs hover:bg-white/[0.06] transition-all"
          >
            แก้ไขข้อมูล
          </button>
        )}
        {onRecalculate && (
          <button
            type="button"
            onClick={onRecalculate}
            className="px-6 py-2.5 bg-lime-300 text-[#07120a] rounded-full font-bold text-xs hover:bg-lime-200 transition-all shadow-md active:scale-95"
          >
            คำนวณใหม่
          </button>
        )}
      </div>
    </div>
  )
}
