'use client'

import React from 'react'
import { baht, useTween } from './fx'
import type { TaxResultData } from './TaxResultView'

/* ---------- Step header: big outlined number + title ---------- */
export function StepHead({ no, title, sub }: { no: string; title: string; sub: string }) {
  return (
    <header className="cx-head">
      <span className="cx-no" aria-hidden="true">{no}</span>
      <div>
        <h2>{title}</h2>
        <p>{sub}</p>
      </div>
    </header>
  )
}

/* ---------- Connected node stepper ---------- */
interface StepperProps {
  step: number
  titles: string[]
  onGo: (step: number) => void
}

export function Stepper({ step, titles, onGo }: StepperProps) {
  const last = titles.length - 1
  return (
    <nav className="cx-stepper" aria-label="ขั้นตอนการคำนวณ">
      <div className="cx-line" aria-hidden="true">
        <i style={{ width: `${((step - 1) / last) * 100}%` }} />
      </div>
      {titles.map((t, i) => {
        const n = i + 1
        const state = n === step ? 'on' : n < step ? 'done' : ''
        return (
          <button key={t} type="button" className={state} onClick={() => onGo(n)} aria-current={n === step ? 'step' : undefined}>
            <span>
              {n < step ? (
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              ) : (
                n
              )}
            </span>
            <em>{t}</em>
          </button>
        )
      })}
    </nav>
  )
}

/* ---------- Sliding segmented choice ---------- */
interface SegmentedProps<T extends string> {
  label: string
  value: T
  options: Array<{ value: T; label: string; icon: React.ReactNode }>
  onChange: (v: T) => void
}

export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value))
  return (
    <div className="cx-field">
      <span className="cx-label">{label}</span>
      <div className="cx-seg" style={{ ['--n' as string]: options.length, ['--i' as string]: idx }}>
        <i aria-hidden="true" />
        {options.map((o) => (
          <button key={o.value} type="button" className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">{o.icon}</svg>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------- − n + counter ---------- */
interface CounterProps {
  label: string
  value: number
  onChange: (v: number) => void
  max?: number
  icon: React.ReactNode
}

export function Counter({ label, value, onChange, max = 20, icon }: CounterProps) {
  return (
    <div className={`cx-counter ${value > 0 ? 'has' : ''}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true">{icon}</svg>
      <span>{label}</span>
      <div>
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))} disabled={value <= 0} aria-label="ลด">−</button>
        <strong key={value}>{value}</strong>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="เพิ่ม">+</button>
      </div>
    </div>
  )
}

/* ---------- Cap usage bar ---------- */
export function CapBar({ value, cap, label = 'เพดาน' }: { value: number; cap: number; label?: string }) {
  const pct = cap > 0 ? Math.min(100, (value / cap) * 100) : 0
  const over = value > cap
  const near = !over && pct >= 80
  return (
    <div className={`cx-cap ${over ? 'over' : near ? 'near' : ''}`}>
      <div><i style={{ width: `${pct}%` }} /></div>
      <small>
        {over
          ? `เกิน${label} ${baht(value - cap)} บาท — ตัวคำนวณจะตัดให้อัตโนมัติ`
          : `ใช้ไป ${Math.round(pct)}% ของ${label} ${baht(cap)} บาท`}
      </small>
    </div>
  )
}

/* ---------- Live receipt ---------- */
export function LiveSummary({ result }: { result: TaxResultData | null }) {
  const due = result?.amountDue ?? 0
  const shown = useTween(Math.abs(due), true, 500)
  const tax = useTween(result?.taxCalculated ?? 0, true, 500)

  const rows: Array<[string, number, string?]> = result
    ? [
        ['เงินได้รวม', result.grossIncome],
        ['หักค่าใช้จ่าย', -result.expenseDeduction],
        ['ค่าลดหย่อนรวม', -result.totalAllowances],
        ['เงินได้สุทธิ', result.netIncome, 'strong'],
      ]
    : []

  return (
    <aside className="cx-live" aria-label="สรุปภาษีแบบสด">
      <div className="cx-receipt">
        <header>
          <b><i aria-hidden="true" /> LIVE</b>
          <span>ใบเสร็จภาษีสด</span>
        </header>

        {result ? (
          <>
            <ul>
              {rows.map(([k, v, cls]) => (
                <li key={k} className={cls}>
                  <span>{k}</span>
                  <b>{v < 0 ? '−' : ''}฿{baht(Math.abs(v))}</b>
                </li>
              ))}
            </ul>

            <div className="cx-tax">
              <small>ภาษีที่คำนวณได้</small>
              <strong>฿{baht(tax)}</strong>
            </div>

            <ul>
              <li>
                <span>ภาษีที่หักไว้แล้ว</span>
                <b>−฿{baht(result.taxWithheld)}</b>
              </li>
            </ul>

            <div className={`cx-due ${due > 0 ? 'owe' : 'refund'}`}>
              <small>{due > 0 ? 'ต้องชำระเพิ่ม' : due < 0 ? 'ได้รับเงินคืน' : 'ไม่มียอดต้องชำระ'}</small>
              <strong>฿{baht(shown)}</strong>
            </div>
          </>
        ) : (
          <p className="cx-empty">กรอกข้อมูลเพื่อดูภาษีโดยประมาณ</p>
        )}
        <p className="cx-note">ประมาณการเบื้องต้น อัปเดตทุกครั้งที่คุณแก้ตัวเลข</p>
      </div>
    </aside>
  )
}
