'use client'

import React, { useState } from 'react'
import { Reveal, SectionHead, baht, useInView, useTween } from './fx'

interface GuideProps {
  onCalculate?: () => void
}

interface Item {
  name: string
  value: string
  note: string
}

const BRACKETS = [
  { rate: 5, range: '150,001 – 300,000' },
  { rate: 10, range: '300,001 – 500,000' },
  { rate: 15, range: '500,001 – 750,000' },
  { rate: 20, range: '750,001 – 1,000,000' },
  { rate: 25, range: '1,000,001 – 2,000,000' },
  { rate: 30, range: '2,000,001 – 5,000,000' },
  { rate: 35, range: 'เกิน 5,000,000' },
]

const TABS: Array<{ key: string; title: string; tag: string; icon: React.ReactNode; items: Item[] }> = [
  {
    key: 'family',
    title: 'ส่วนตัวและครอบครัว',
    tag: 'สิทธิพื้นฐาน',
    icon: <path d="M16 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9.5 10a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-2a4 4 0 00-3-3.9M15.5 3.2a3.5 3.5 0 010 6.6" />,
    items: [
      { name: 'ส่วนตัวผู้เสียภาษี', value: '60,000 บาท', note: 'ได้รับสิทธิ์ทุกคนทันที' },
      { name: 'คู่สมรส (ไม่มีรายได้)', value: '60,000 บาท', note: 'ต้องจดทะเบียนสมรสถูกต้อง' },
      { name: 'บุตรชอบด้วยกฎหมาย', value: '30,000 – 60,000 บาท/คน', note: 'บุตรเกิดปี 2561 ขึ้นไปได้ 60,000 บาทตั้งแต่คนสองเป็นต้นไป' },
      { name: 'อุปการะบิดามารดา', value: '30,000 บาท/คน', note: 'อายุ 60 ปีขึ้นไป และรายได้ไม่เกิน 30,000 บ./ปี' },
      { name: 'ผู้พิการในอุปการะ', value: '60,000 บาท/คน', note: 'มีบัตรประจำตัวผู้พิการและใบรับรอง' },
    ],
  },
  {
    key: 'save',
    title: 'ประกันและออมเกษียณ',
    tag: 'ลดภาษี + สร้างความมั่นคง',
    icon: <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />,
    items: [
      { name: 'ประกันชีวิตทั่วไป', value: 'ตามจ่ายจริง ไม่เกิน 100,000 บาท', note: 'คุ้มครอง 10 ปีขึ้นไป' },
      { name: 'ประกันสุขภาพตนเอง', value: 'ตามจ่ายจริง ไม่เกิน 25,000 บาท', note: 'รวมกับประกันชีวิตไม่เกิน 100,000 บาท' },
      { name: 'ประกันสุขภาพบิดามารดา', value: 'ตามจ่ายจริง ไม่เกิน 15,000 บาท', note: 'บิดามารดารายได้ไม่เกิน 30,000 บ./ปี' },
      { name: 'กองทุน RMF', value: 'ไม่เกิน 30% ของเงินได้', note: 'ถือครอง 5 ปีเต็ม และถึงอายุ 55 ปี' },
      { name: 'กองทุน PVD / กบข.', value: 'ไม่เกิน 15% ของเงินได้', note: 'หักผ่านระบบเงินเดือนนายจ้าง' },
    ],
  },
  {
    key: 'home',
    title: 'บ้านและการบริจาค',
    tag: 'สิทธิพิเศษ',
    icon: <path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" />,
    items: [
      { name: 'ดอกเบี้ยเงินกู้ยืมเพื่อซื้อบ้าน', value: 'ตามจ่ายจริง ไม่เกิน 100,000 บาท', note: 'กรณีซื้อร่วมหารตามจำนวนผู้กู้' },
      { name: 'เงินบริจาคการศึกษา/กีฬา/รพ.รัฐ', value: 'ลดหย่อน 2 เท่าของที่จ่ายจริง', note: 'หักได้ไม่เกิน 10% ของเงินได้หลังหักลดหย่อน' },
      { name: 'เงินบริจาคทั่วไป', value: 'ตามจ่ายจริง (1 เท่า)', note: 'หักได้ไม่เกิน 10% ของเงินได้หลังหักลดหย่อน' },
    ],
  },
]

const spotlight = (e: React.MouseEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
  e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
}

/* ------------------------------------------------------------------ */
function Simulator() {
  const [amount, setAmount] = useState(30000)
  const [rate, setRate] = useState(10)
  const [ref, seen] = useInView<HTMLDivElement>(0.2)
  const saved = (amount * rate) / 100
  const shown = useTween(saved, seen)
  const bracket = BRACKETS.find((b) => b.rate === rate)
  const ringLen = 2 * Math.PI * 78

  return (
    <div ref={ref} className="gd-sim">
      <Reveal className="gd-sim-form">
        <label>
          <span>จำนวนเงินที่ต้องการซื้อเพิ่ม (บาท)</span>
          <input
            type="number"
            min="0"
            step="5000"
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
          />
        </label>
        <input
          className="lw-range"
          type="range"
          min="0"
          max="200000"
          step="5000"
          value={Math.min(amount, 200000)}
          onChange={(e) => setAmount(Number(e.target.value))}
          style={{ ['--p' as string]: `${(Math.min(amount, 200000) / 200000) * 100}%` }}
          aria-label="จำนวนเงินที่ต้องการซื้อเพิ่ม"
        />
        <div className="lw-presets">
          {[10000, 30000, 50000, 100000].map((v) => (
            <button key={v} type="button" onClick={() => setAmount(v)} className={amount === v ? 'on' : ''}>
              ฿{v.toLocaleString('th-TH')}
            </button>
          ))}
        </div>

        <div className="gd-rates-label">ฐานภาษีสูงสุดของคุณ</div>
        <div className="gd-rates">
          {BRACKETS.map((b) => (
            <button key={b.rate} type="button" onClick={() => setRate(b.rate)} className={rate === b.rate ? 'on' : ''}>
              {b.rate}%
            </button>
          ))}
        </div>
        <p className="gd-rate-range">เงินได้สุทธิ {bracket?.range} บาท</p>
      </Reveal>

      <Reveal className="gd-gauge" delay={120}>
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <circle className="gd-g-spin" cx="100" cy="100" r="94" />
          <circle className="gd-g-bg" cx="100" cy="100" r="78" />
          <circle
            className="gd-g-fg"
            cx="100"
            cy="100"
            r="78"
            style={{ strokeDasharray: ringLen, strokeDashoffset: ringLen * (1 - rate / 35) }}
          />
        </svg>
        <div className="gd-g-mid">
          <small>ประหยัดภาษีได้ประมาณ</small>
          <strong>฿{baht(shown)}</strong>
          <em>
            ฿{amount.toLocaleString('th-TH')} × {rate}%
          </em>
        </div>
        <span className="gd-coin c1" aria-hidden="true">฿</span>
        <span className="gd-coin c2" aria-hidden="true">฿</span>
        <span className="gd-coin c3" aria-hidden="true">฿</span>
      </Reveal>
    </div>
  )
}

/* ------------------------------------------------------------------ */
function Categories() {
  const [tab, setTab] = useState(0)
  const cur = TABS[tab]

  return (
    <div>
      <Reveal className="gd-tabs" delay={60}>
        {TABS.map((t, i) => (
          <button key={t.key} type="button" onClick={() => setTab(i)} className={i === tab ? 'on' : ''}>
            <svg viewBox="0 0 24 24" aria-hidden="true">{t.icon}</svg>
            <span>{t.title}</span>
          </button>
        ))}
        <i className="gd-tab-ind" style={{ ['--i' as string]: tab }} aria-hidden="true" />
      </Reveal>

      <div key={cur.key} className="gd-list">
        <p className="gd-list-tag">{cur.tag}</p>
        {cur.items.map((it, i) => (
          <article
            key={it.name}
            className="gd-ticket"
            style={{ ['--d' as string]: `${i * 70}ms` }}
            onMouseMove={spotlight}
          >
            <span className="gd-ticket-no">{String(i + 1).padStart(2, '0')}</span>
            <div className="gd-ticket-main">
              <h4>{it.name}</h4>
              <p>{it.note}</p>
            </div>
            <strong>{it.value}</strong>
          </article>
        ))}

        {cur.key === 'save' && (
          <article className="gd-ticket gd-ceiling" style={{ ['--d' as string]: `${cur.items.length * 70}ms` }} onMouseMove={spotlight}>
            <div className="gd-ceiling-tape" aria-hidden="true"><i /></div>
            <div className="gd-ceiling-body">
              <span className="gd-ticket-no">!</span>
              <div className="gd-ticket-main">
                <h4>เพดานกลุ่มออมเกษียณรวม</h4>
                <p>รวม RMF + PVD + กบข. + ประกันบำนาญ</p>
              </div>
              <strong>ไม่เกิน 500,000 บาท</strong>
            </div>
          </article>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
export default function TaxDeductionGuideView({ onCalculate }: GuideProps) {
  return (
    <div className="lw gd">
      <div className="fx-orb fx-orb-a" aria-hidden="true" />
      <div className="fx-orb fx-orb-b" aria-hidden="true" />

      <header className="lw-hero">
        <svg className="gd-bulb" viewBox="0 0 100 120" aria-hidden="true">
          <g className="rays">
            <path d="M50 6V-4M18 20l-8-8M82 20l8-8M6 52H-6M94 52h12" />
          </g>
          <path className="glass" d="M50 14c-17 0-30 13-30 29 0 11 6 18 12 24 3 3 4 6 4 10v4h28v-4c0-4 1-7 4-10 6-6 12-13 12-24 0-16-13-29-30-29z" />
          <path className="base" d="M38 88h24M40 96h20M44 104h12" />
          <path className="fil" d="M42 62l8-12 8 12" />
        </svg>
        <p className="fx-eyebrow">Deduction Guide &amp; Planning</p>
        <h1>
          ลดหย่อนภาษี<i>.</i>
        </h1>
        <p className="lw-hero-sub">
          สรุปเพดานสิทธิลดหย่อนทุกหมวดหมู่ และเครื่องมือประเมินภาษีที่ประหยัดได้ทันทีโดยไม่ต้องคำนวณแบบเต็ม
        </p>
        <span className="lw-chip">ปีภาษี 2569</span>
      </header>

      <section className="lw-sec">
        <SectionHead no="01" title="ลองจำลองภาษีที่ประหยัดได้" sub="เลื่อนจำนวนเงินและเลือกฐานภาษี แล้วดูตัวเลขเปลี่ยนทันที" />
        <Simulator />
      </section>

      <section className="lw-sec">
        <SectionHead no="02" title="เพดานลดหย่อนตามกฎหมาย" sub="สรุป 3 หมวดหมู่ — เลือกแท็บเพื่อดูรายการ" />
        <Categories />
      </section>

      {onCalculate && (
        <Reveal className="fx-cta">
          <p>รู้สิทธิแล้ว ลองคำนวณภาษีจริงของคุณ</p>
          <button type="button" onClick={onCalculate}>
            เริ่มคำนวณ <span aria-hidden="true">→</span>
          </button>
        </Reveal>
      )}
    </div>
  )
}
