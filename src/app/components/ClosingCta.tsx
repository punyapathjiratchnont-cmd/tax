'use client'

import React, { useEffect, useRef, useState } from 'react'

interface ClosingCtaProps {
  onStart: () => void
  onGuide: () => void
}

export default function ClosingCta({ onStart, onGuide }: ClosingCtaProps) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setShown(true)
      },
      { threshold: 0.25 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section ref={ref} className={`cta-section ${shown ? 'is-shown' : ''}`} aria-label="เริ่มคำนวณภาษี">
      <svg className="ex-waves" viewBox="0 0 1200 700" preserveAspectRatio="none" aria-hidden="true">
        <path d="M-20 120 C 220 -40 520 60 700 160 S 1100 240 1240 40" />
        <path d="M-30 330 C 100 250 280 300 300 190 S 100 100 -20 230" />
        <path d="M1240 360 C 1080 300 960 400 1240 540" />
        <path className="ex-dash" d="M-20 470 C 220 430 380 500 580 590 S 980 690 1240 620" />
      </svg>

      <div className="cta-inner">
        <div className="cta-text">
          <h2>
            ภาษีของคุณ
            <br />
            เห็นภาพได้
          </h2>
          <p>รู้ภาษีทั้งปี ลองลดหย่อน แล้ววางแผนเงินของคุณ</p>

          <div className="cta-actions">
            <button type="button" className="cta-primary" onClick={onStart}>
              คำนวณของฉัน
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9" /></svg>
            </button>
            <button type="button" className="cta-ghost" onClick={onGuide}>
              คู่มือลดหย่อน
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v14M12 6C10 4.5 6 4 3 5v14c3-1 7-.5 9 1M12 6c2-1.5 6-2 9-1v14c-3-1-7-.5-9 1" /></svg>
            </button>
          </div>

          <ul className="cta-notes">
            <li>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              ไม่ต้องสมัคร
            </li>
            <li>
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>
              คำนวณในเครื่องของคุณ
            </li>
          </ul>
        </div>

        <div className="cta-visual">
          <div className="cta-card cta-card-a">
            <p>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 7L7 17M7 8v9h9" /></svg>
              รายได้ทั้งปี
            </p>
            <strong>
              630,000 <small>บาท</small>
            </strong>
            <span>เงินเดือน + โบนัส</span>
            <div className="ex-bar"><i style={{ ['--w' as string]: '100%' }} /></div>
          </div>

          <div className="cta-card cta-card-b">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>
            <div>
              <p>สิทธิ์ลดหย่อน</p>
              <strong>
                186,000 <small>บาท</small>
              </strong>
            </div>
          </div>

          <svg className="cta-wallet" viewBox="0 0 460 380" aria-hidden="true">
            <ellipse cx="220" cy="350" rx="190" ry="16" fill="rgba(0,0,0,0.55)" stroke="none" />
            {/* left side */}
            <polygon points="36,110 92,134 92,332 36,298" fill="#3fbf7a" stroke="#0a2616" strokeWidth="3" strokeLinejoin="round" />
            {/* top */}
            <polygon points="36,110 92,134 372,98 318,76" fill="#8cf0b4" stroke="#0a2616" strokeWidth="3" strokeLinejoin="round" />
            {/* front */}
            <polygon points="92,134 372,98 372,300 92,332" fill="#66e09a" stroke="#0a2616" strokeWidth="3" strokeLinejoin="round" />
            <path d="M120 172 L340 146 M120 300 L340 278" stroke="rgba(10,38,22,0.45)" strokeWidth="2" strokeDasharray="7 7" fill="none" />
            {/* clasp */}
            <path d="M326 176 L420 166 Q432 168 432 182 L432 236 Q432 252 418 252 L326 262 Q300 262 300 232 L300 206 Q300 178 326 176Z" fill="#0b130d" stroke="#8cf06a" strokeWidth="2" />
            <circle cx="336" cy="218" r="9" fill="#66e09a" />
            <text x="132" y="236" transform="rotate(-5 132 236)" fontFamily="var(--font-prompt)" fontWeight="700" fontSize="34" fill="#0a2616">TAX.</text>
          </svg>
          <p className="cta-caption">ข้อมูลตัวอย่าง · ปี 2569</p>
        </div>
      </div>

      <p className="cta-foot">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="8" width="18" height="12" rx="2" /><path d="M9 8V6a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18" /></svg>
        เงินเดือน + โบนัส · ปีภาษี 2569
      </p>
    </section>
  )
}
