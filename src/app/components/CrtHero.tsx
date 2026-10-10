'use client'

import React from 'react'

interface CrtHeroProps {
  onStart: () => void
  onGuide: () => void
}

// Fixed positions so server and client render the same markup
const PARTICLES = [
  { left: '8%', delay: '0s', dur: '9s', size: 4 },
  { left: '17%', delay: '3.2s', dur: '11s', size: 3 },
  { left: '26%', delay: '6.1s', dur: '8s', size: 5 },
  { left: '38%', delay: '1.4s', dur: '12s', size: 3 },
  { left: '61%', delay: '4.6s', dur: '10s', size: 4 },
  { left: '72%', delay: '0.8s', dur: '9.5s', size: 3 },
  { left: '83%', delay: '5.3s', dur: '11.5s', size: 5 },
  { left: '92%', delay: '2.5s', dur: '8.5s', size: 3 },
]

export default function CrtHero({ onStart, onGuide }: CrtHeroProps) {
  return (
    <section className="crt-section">
      <div className="crt-ambient" />
      <div className="crt-floor" aria-hidden="true" />
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="crt-particle"
          aria-hidden="true"
          style={{ left: p.left, animationDelay: p.delay, animationDuration: p.dur, width: p.size, height: p.size }}
        />
      ))}

      <div className="crt-layout">
        <span className="crt-pill">
          <i /> ภาษีไม่ต้องยาก · ปีภาษี 2569
        </span>

        <div className="crt-monitor">
          <div className="crt-body">
            <div className="crt-screen">
              <div className="crt-display">
                <svg className="crt-doodle" viewBox="0 0 60 60" aria-hidden="true">
                  <path d="M30 6 C48 4 56 22 50 38 C44 54 20 56 10 42 C2 30 12 12 30 14 C42 16 46 30 38 38 C30 46 18 40 20 30 C22 22 32 22 34 28" fill="none" stroke="#d6f5c8" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <div className="crt-copy">
                  <p className="crt-prompt">C:\TAX&gt; run pnd91.exe</p>
                  <h1 className="crt-title">
                    <span>คำนวณภาษี</span>
                    <em>
                      ให้ง่ายกว่าเดิม<i className="crt-cursor" aria-hidden="true" />
                    </em>
                  </h1>
                  <p className="crt-sub">
                    กรอกรายได้ เลือกค่าลดหย่อน แล้วดู <strong>ภาษีที่ต้องจ่ายหรือขอคืน</strong> ภ.ง.ด. 91 ได้ในไม่กี่นาที
                  </p>
                  <div className="crt-actions">
                    <button type="button" className="crt-btn crt-btn-primary" onClick={onStart}>
                      <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1 L9 5 L2 9Z" fill="currentColor" /></svg>
                      เริ่มคำนวณ
                    </button>
                    <button type="button" className="crt-btn" onClick={onGuide}>
                      <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1 H8 V9 L5 7 L2 9Z" fill="currentColor" /></svg>
                      ดูวิธีลดหย่อน
                    </button>
                  </div>
                </div>
                <div className="crt-sweep" />
                <div className="crt-scan" />
              </div>
              <div className="crt-glass" />
            </div>

            <div className="crt-panel">
              <span className="crt-badge">TAX-91</span>
              <span className="crt-vent" />
              <span className="crt-controls">
                <span className="crt-led" />
                <span className="crt-knob" />
                <span className="crt-knob" />
              </span>
            </div>
          </div>
          <div className="crt-neck" />
          <div className="crt-base" />
          <div className="crt-shadow" />
        </div>
      </div>

      <button
        type="button"
        className="crt-hint"
        onClick={() => document.querySelector('.ex-section')?.scrollIntoView({ behavior: 'smooth' })}
      >
        <span className="crt-mouse"><i /></span>
        เลื่อนลงเพื่อเริ่ม
      </button>
    </section>
  )
}
