'use client'

import React, { useEffect, useRef, useState } from 'react'

interface ScrollExplainerProps {
  onStart: () => void
}

const STEPS = ['กรอกรายได้', 'เข้าใจภาษี', 'ง่ายแค่นี้เอง']

const fmt = (n: number) => Math.round(n).toLocaleString('en-US')

/** Counts from `from` to `to` each time `active` turns true. */
function useCountUp(to: number, active: boolean, from = 0, duration = 1100) {
  const [value, setValue] = useState(from)
  useEffect(() => {
    if (!active) return
    let raf = 0
    const start = performance.now() + 250
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / duration))
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(from + (to - from) * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, to, from, duration])
  // Inactive slides show the starting value; the animation restarts when they become active again
  return active ? value : from
}

function Mascot() {
  return (
    <svg className="ex-mascot" viewBox="0 0 64 72" aria-hidden="true">
      <path d="M32 6 V0" stroke="#8cf06a" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="32" cy="0" r="3" fill="#8cf06a" />
      <rect x="6" y="8" width="52" height="42" rx="11" fill="#2f9a45" stroke="#061009" strokeWidth="3" />
      <rect x="12" y="14" width="40" height="30" rx="7" fill="#06130a" />
      <ellipse cx="24" cy="27" rx="3.2" ry="4.2" fill="#8cf06a" />
      <ellipse cx="40" cy="27" rx="3.2" ry="4.2" fill="#8cf06a" />
      <path d="M25 35 Q32 41 39 35" fill="none" stroke="#8cf06a" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24 50 L20 62 L44 62 L40 50Z" fill="#1d6a30" stroke="#061009" strokeWidth="3" strokeLinejoin="round" />
      <path d="M26 56 L32 70 L38 56Z" fill="#8cf06a" stroke="#061009" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  )
}

function SlideIncome({ active }: { active: boolean }) {
  const total = useCountUp(630000, active)
  return (
    <div className="ex-card">
      <header>
        <b>
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M3 10h18M16 14.5h2" /></svg>
          รายได้ของฉัน
        </b>
        <span>2569</span>
      </header>
      <label className="ex-label">เงินเดือนต่อเดือน</label>
      <div className="ex-field">
        <strong>45,000</strong>
        <i className="ex-caret" />
        <em className="ex-cursor">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 1 L14 6 L8 8 L6 14Z" fill="#8cf06a" /></svg>
          <span>TAX</span>
        </em>
        <small>บาท</small>
      </div>
      <div className="ex-row"><span>× 12 เดือน</span><b className="ex-x">✕</b></div>
      <div className="ex-row ex-bonus">
        <span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="9" width="18" height="12" rx="2" /><path d="M12 9v12M3 13h18M12 9c-3 0-4-4-1.5-4S12 9 12 9zm0 0c3 0 4-4 1.5-4S12 9 12 9z" /></svg>
          โบนัสทั้งปี
        </span>
        <b>90,000</b>
      </div>
      <div className="ex-total">
        <label>รายได้ทั้งปี</label>
        <p>
          <strong>{fmt(total)}</strong> <small>บาท</small>
        </p>
      </div>
      <div className="ex-tag">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M3 10h18M16 14.5h2" /></svg>
        เงินเดือน
        <br />+ โบนัส
      </div>
    </div>
  )
}

function SlideTax({ active }: { active: boolean }) {
  const tax = useCountUp(11900, active)
  return (
    <div className="ex-card ex-receipt">
      <header>
        <b>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6z" /><path d="M9 11h7M9 15h7M9 7h3" /></svg>
          สรุปภาษีของฉัน
        </b>
        <span>2569</span>
      </header>
      <label className="ex-label">ภาษีทั้งปีโดยประมาณ</label>
      <p className="ex-big ex-rose">
        <strong>{fmt(tax)}</strong> <small>บาท</small>
      </p>
      <div className="ex-bars">
        <div>
          <p><span>รายได้ทั้งปี</span><b>630,000</b></p>
          <div className="ex-bar"><i style={{ ['--w' as string]: '100%' }} /></div>
        </div>
        <div>
          <p><span>เหลือคิดภาษี</span><b>344,000</b></p>
          <div className="ex-bar"><i style={{ ['--w' as string]: '55%' }} /></div>
        </div>
      </div>
      <p className="ex-check">✓ หักค่าใช้จ่ายและค่าลดหย่อนแล้ว</p>
      <div className="ex-badge" />
    </div>
  )
}

function SlideCompare({ active }: { active: boolean }) {
  const rmf = useCountUp(50000, active, 20000)
  const after = useCountUp(8900, active, 11900)
  const saved = useCountUp(3000, active)
  return (
    <div className="ex-card">
      <header>
        <b>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></svg>
          ลองก่อนตัดสินใจ
        </b>
      </header>
      <div className="ex-compare">
        <div><label>ก่อนปรับ</label><strong className="ex-rose">11,900</strong></div>
        <span>→</span>
        <div><label>หลังปรับ</label><strong>{fmt(after)}</strong></div>
      </div>
      <div className="ex-row ex-rmf"><span>RMF ทั้งปี</span><b>{fmt(rmf)} บาท</b></div>
      <div className="ex-slider">
        <div className="ex-track"><i /></div>
        <div className="ex-thumb" />
      </div>
      <div className="ex-row ex-scale"><span>0</span><span>100,000</span></div>
      <div className="ex-save">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>
        <div>
          <label>ภาษีลดลง</label>
          <p><strong>{fmt(saved)}</strong> <small>บาท</small></p>
        </div>
      </div>
      <div className="ex-row ex-foot">
        <span>ใช้เงินเพิ่ม</span>
        <b className="ex-rose">30,000 บาท</b>
      </div>
      <p className="ex-note">ตัวอย่างเมื่อเข้าเงื่อนไขสิทธิ์ RMF (ฐานภาษี 10%)</p>
      <div className="ex-chip">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></svg>
      </div>
    </div>
  )
}

const COPY = [
  { title: 'กรอกรายได้', text: 'ใส่เงินเดือนและโบนัสของปีนี้ เครื่องคำนวณรวมยอดทั้งปีให้ ไม่ต้องนั่งบวกเอง' },
  { title: 'เข้าใจภาษี', text: 'ดูว่าเงินส่วนไหนถูกนำมาคิดภาษี หลังหักค่าใช้จ่ายและค่าลดหย่อนแล้ว' },
  { title: 'ง่ายแค่นี้เอง', text: 'ลองปรับยอดลดหย่อน เทียบก่อน-หลัง และดูเงินที่ต้องจ่ายเพิ่ม ก่อนตัดสินใจจริง' },
]

export default function ScrollExplainer({ onStart }: ScrollExplainerProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    let frame = 0

    const update = () => {
      frame = 0
      const range = section.offsetHeight - window.innerHeight
      if (range <= 0) return
      const p = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / range))
      setStep(Math.min(STEPS.length - 1, Math.floor(p * STEPS.length)))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  const goTo = (idx: number) => {
    const section = sectionRef.current
    if (!section) return
    const range = section.offsetHeight - window.innerHeight
    const top = section.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top: top + range * ((idx + 0.5) / STEPS.length), behavior: 'smooth' })
  }

  return (
    <section ref={sectionRef} className="ex-section" aria-label="วิธีใช้งานเครื่องคำนวณ">
      <div className="ex-stage">
        <svg className="ex-waves" viewBox="0 0 1200 700" preserveAspectRatio="none" aria-hidden="true">
          <path d="M-20 160 C 200 -40 520 20 760 150 S 1180 260 1240 60" />
          <path d="M-40 360 C 120 280 300 330 340 220 S 120 120 -20 260" />
          <path d="M760 -20 C 900 80 1100 120 1240 40" />
          <path d="M1240 380 C 1100 330 980 420 1240 520" />
          <path className="ex-dash" d="M-20 440 C 200 410 360 470 560 560 S 980 680 1240 610" />
        </svg>

        {COPY.map((c, i) => {
          const state = i === step ? 'is-active' : i < step ? 'is-past' : 'is-next'
          return (
            <div key={c.title} className={`ex-slide ${state}`} aria-hidden={i !== step}>
              <div className="ex-text">
                <h2>
                  {c.title}
                  <i>.</i>
                  <Mascot />
                </h2>
                <p>{c.text}</p>
                {i === STEPS.length - 1 && (
                  <button type="button" className="ex-cta" onClick={onStart} tabIndex={i === step ? 0 : -1}>
                    เริ่มคำนวณจริง <span aria-hidden="true">→</span>
                  </button>
                )}
              </div>
              <div className="ex-visual">
                {i === 0 && <SlideIncome active={i === step} />}
                {i === 1 && <SlideTax active={i === step} />}
                {i === 2 && <SlideCompare active={i === step} />}
              </div>
            </div>
          )
        })}

        <ol className="ex-steps">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button type="button" className={i === step ? 'on' : i < step ? 'done' : ''} onClick={() => goTo(i)}>
                <span>{i + 1}</span>
                {s}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
