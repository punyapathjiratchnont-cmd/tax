'use client'

import React, { useState } from 'react'
import { Reveal, SectionHead, baht, useInView, useTween } from './fx'

interface LawProps {
  onCalculate?: () => void
}

const QUIZ = [
  { text: 'ซื้อกองทุน RMF เพื่อใช้สิทธิลดหย่อนภาษี', planning: true, why: 'เป็นสิทธิที่กฎหมายกำหนดไว้ ใช้ได้อย่างถูกต้อง' },
  { text: 'ไม่แจ้งรายได้พิเศษที่ได้รับระหว่างปี', planning: false, why: 'การปกปิดรายได้คือการเลี่ยงภาษี มีโทษตามมาตรา 37' },
  { text: 'บริจาคผ่านระบบ e-Donation แล้วนำมาลดหย่อน', planning: true, why: 'บริจาคจริงและมีหลักฐาน ใช้สิทธิลดหย่อนได้ตามกฎหมาย' },
  { text: 'ทำใบเสร็จปลอมเพื่อเพิ่มค่าลดหย่อน', planning: false, why: 'ปลอมแปลงเอกสารเป็นความผิด ทั้งโทษจำคุกและปรับ' },
]

const DOCS = [
  { t: 'หนังสือรับรองการหักภาษี (ใบ 50 ทวิ)', d: 'เพื่อยืนยันยอดรายได้และภาษีที่นายจ้างหักไว้แล้ว' },
  { t: 'ใบเสร็จและหนังสือรับรองประกัน', d: 'ใบรับรองเบี้ยประกันชีวิต ประกันสุขภาพตนเองและบิดามารดา' },
  { t: 'หนังสือรับรองดอกเบี้ยบ้าน', d: 'ออกโดยธนาคารหรือสถาบันการเงินผู้ให้กู้ยืม' },
  { t: 'เอกสารบริจาค / e-Donation', d: 'ใบอนุโมทนาบัตร หรือหลักฐานผ่านระบบ e-Donation' },
  { t: 'หนังสือรับรอง RMF / กองทุน', d: 'หนังสือรับรองการซื้อหน่วยลงทุนจาก บลจ.' },
  { t: 'เอกสารคู่สมรส / บุตร / ผู้สูงอายุ', d: 'ทะเบียนสมรส สูติบัตรบุตร ใบ กย.02 และบัตรผู้พิการ' },
]

const Check = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
)

/* ------------------------------------------------------------------ */
function Penalties() {
  const [amount, setAmount] = useState(10000)
  const [months, setMonths] = useState(3)
  const [ref, seen] = useInView<HTMLDivElement>(0.15)
  const surcharge = amount * 0.015 * months
  const sur = useTween(surcharge, seen)
  const lo = useTween(amount, seen)
  const hi = useTween(amount * 2, seen)

  return (
    <div ref={ref}>
      <Reveal className="lw-controls">
        <label>
          <span>ภาษีที่ค้างชำระ (บาท)</span>
          <input
            type="number"
            min="0"
            step="1000"
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
          />
          <div className="lw-presets">
            {[5000, 10000, 50000, 100000].map((v) => (
              <button key={v} type="button" onClick={() => setAmount(v)} className={amount === v ? 'on' : ''}>
                {v.toLocaleString('th-TH')}
              </button>
            ))}
          </div>
        </label>
        <label>
          <span>
            จ่ายล่าช้า <b>{months}</b> เดือน
          </span>
          <input
            className="lw-range"
            type="range"
            min="1"
            max="12"
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            style={{ ['--p' as string]: `${((months - 1) / 11) * 100}%` }}
          />
          <div className="lw-range-scale"><span>1</span><span>6</span><span>12</span></div>
        </label>
      </Reveal>

      <div className="lw-risk" aria-hidden="true">
        <span>เบา</span>
        <div><i className={seen ? 'go' : ''} /></div>
        <span>หนัก</span>
      </div>

      <div className="lw-stairs">
        <Reveal className="lw-step lw-s1" delay={0}>
          <div className="lw-step-in">
            <em>ระดับ 1</em>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
            <h3>เงินเพิ่ม (ดอกเบี้ยปรับ)</h3>
            <p>กรณีชำระภาษีขาด หรือยื่นแบบล่าช้าเกินกำหนดเวลาที่กฎหมายกำหนด</p>
            <div className="lw-rule">1.5% ต่อเดือน (หรือเศษของเดือน) ของเงินภาษีที่ต้องชำระ</div>
            <div className="lw-out">
              <small>ล่าช้า {months} เดือน เสียเพิ่มประมาณ</small>
              <strong>฿{baht(sur)}</strong>
            </div>
          </div>
        </Reveal>

        <Reveal className="lw-step lw-s2" delay={140}>
          <div className="lw-step-in">
            <em>ระดับ 2</em>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18v.5" /></svg>
            <h3>เบี้ยปรับ (Penalties)</h3>
            <p>กรณีไม่ยื่นแบบแสดงรายการภายในกำหนด หรือยื่นแบบไม่ถูกต้องตามความจริง</p>
            <div className="lw-rule">เบี้ยปรับ 1 เท่า ถึง 2 เท่า ของจำนวนเงินภาษีที่ต้องชำระ</div>
            <div className="lw-out">
              <small>จากยอดนี้ อาจถูกปรับ</small>
              <strong>฿{baht(lo)} – ฿{baht(hi)}</strong>
            </div>
          </div>
        </Reveal>

        <Reveal className="lw-step lw-s3" delay={280}>
          <div className="lw-step-in">
            <em>ระดับ 3</em>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>
            <h3>โทษอาญา มาตรา 37</h3>
            <p>ผู้ใดจงใจแจ้งข้อความเท็จ ให้ถ้อยคำเท็จ หรือแสดงพยานหลักฐานอันเป็นเท็จเพื่อหลีกเลี่ยงการเสียภาษี</p>
            <div className="lw-gauges">
              <div>
                <small>จำคุก 3 เดือน – 7 ปี</small>
                <div className="lw-gauge"><i style={{ ['--a' as string]: '4%', ['--b' as string]: '100%' }} className={seen ? 'go' : ''} /></div>
              </div>
              <div>
                <small>ปรับ 2,000 – 200,000 บาท</small>
                <div className="lw-gauge"><i style={{ ['--a' as string]: '1%', ['--b' as string]: '100%' }} className={seen ? 'go' : ''} /></div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
function Versus() {
  const [i, setI] = useState(0)
  const [pick, setPick] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const done = i >= QUIZ.length
  const q = QUIZ[Math.min(i, QUIZ.length - 1)]
  const correct = pick !== null && pick === q.planning

  const answer = (planning: boolean) => {
    if (pick !== null) return
    setPick(planning)
    if (planning === q.planning) setScore((s) => s + 1)
  }
  const next = () => {
    setPick(null)
    setI((n) => n + 1)
  }
  const reset = () => {
    setI(0)
    setPick(null)
    setScore(0)
  }

  return (
    <>
      <Reveal className="lw-vs">
        <div className="lw-side lw-good">
          <div className="lw-side-ico">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>
          </div>
          <h3>การวางแผนภาษี</h3>
          <small>Tax Avoidance / Planning</small>
          <p>
            คือการใช้สิทธิลดหย่อน ยกเว้น หรือสิทธิประโยชน์ทางภาษีที่มีกำหนดไว้ในกฎหมายอย่างถูกเกณฑ์
            เช่น การทำประกันชีวิต การซื้อกองทุน RMF/SSF หรือการบริจาคผ่าน e-Donation
          </p>
          <span className="lw-tag">✓ ถูกต้องตามกฎหมาย 100%</span>
        </div>
        <div className="lw-vs-badge" aria-hidden="true"><b>VS</b></div>
        <div className="lw-side lw-bad">
          <div className="lw-side-ico">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" /></svg>
          </div>
          <h3>การหนี้ / เลี่ยงภาษี</h3>
          <small>Tax Evasion</small>
          <p>
            คือการเจตนาปกปิดรายได้ ซ่อนสลิปเงินเดือน ปลอมแปลงเอกสารใบเสร็จ หรือไม่ยอมยื่นแบบแสดงรายการตามความจริง
            เพื่อหวังจ่ายภาษีน้อยลงหรือได้รับเงินคืนโดยไม่ตรงสิทธิ
          </p>
          <span className="lw-tag">✕ ผิดกฎหมาย มีโทษจำคุกและปรับ</span>
        </div>
      </Reveal>

      <Reveal className="lw-quiz" delay={120}>
        <header>
          <b>ลองทายดู</b>
          <span>แบบไหนคือ “วางแผนภาษี”?</span>
          <em>{Math.min(i + 1, QUIZ.length)}/{QUIZ.length}</em>
        </header>

        {!done ? (
          <div key={i} className={`lw-q ${pick === null ? '' : correct ? 'ok' : 'no'}`}>
            <p>“{q.text}”</p>
            <div className="lw-q-btns">
              <button type="button" onClick={() => answer(true)} className={pick === true ? 'sel' : ''} disabled={pick !== null}>
                ✓ วางแผนภาษี
              </button>
              <button type="button" onClick={() => answer(false)} className={pick === false ? 'sel' : ''} disabled={pick !== null}>
                ✕ เลี่ยงภาษี
              </button>
            </div>
            {pick !== null && (
              <div className="lw-q-fb">
                <strong>{correct ? 'ถูกต้อง!' : 'ยังไม่ใช่'}</strong>
                <span>{q.why}</span>
                <button type="button" onClick={next}>{i === QUIZ.length - 1 ? 'ดูคะแนน' : 'ข้อถัดไป →'}</button>
              </div>
            )}
          </div>
        ) : (
          <div className="lw-q done">
            <strong className="lw-score">{score}<small>/{QUIZ.length}</small></strong>
            <p>{score === QUIZ.length ? 'เยี่ยม! แยกแยะได้ครบทุกข้อ' : 'ลองอีกครั้งเพื่อทบทวนความต่างระหว่างสองแบบ'}</p>
            <button type="button" className="lw-again" onClick={reset}>เล่นอีกครั้ง</button>
          </div>
        )}
      </Reveal>
    </>
  )
}

/* ------------------------------------------------------------------ */
function Docs() {
  const [got, setGot] = useState<boolean[]>(() => DOCS.map(() => false))
  const count = got.filter(Boolean).length
  const pct = (count / DOCS.length) * 100
  const toggle = (i: number) => setGot((g) => g.map((v, k) => (k === i ? !v : v)))

  return (
    <div className="lw-docs-wrap">
      <Reveal className="lw-ring">
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <circle className="lw-ring-spin" cx="100" cy="100" r="92" />
          <circle className="lw-ring-bg" cx="100" cy="100" r="70" />
          <circle
            className="lw-ring-fg"
            cx="100"
            cy="100"
            r="70"
            style={{ ['--dash' as string]: `${(pct / 100) * 440}` }}
          />
        </svg>
        <div className="lw-ring-mid">
          <strong>5</strong>
          <span>ปี</span>
        </div>
        <p>เก็บหลักฐานอย่างน้อย 5 ปี นับแต่วันที่ยื่นแบบ เพราะสรรพากรมีอำนาจสุ่มตรวจย้อนหลัง</p>
        <div className="lw-ring-count">
          เตรียมแล้ว <b>{count}</b>/{DOCS.length}
        </div>
      </Reveal>

      <div className="lw-docs" role="list">
        {DOCS.map((d, i) => (
          <Reveal key={d.t} delay={i * 70}>
            <div role="listitem">
              <button type="button" className={got[i] ? 'on' : ''} onClick={() => toggle(i)} aria-pressed={got[i]}>
                <span className="lw-box"><Check /></span>
                <span className="lw-doc-no">{String(i + 1).padStart(2, '0')}</span>
                <span className="lw-doc-t">
                  <b>{d.t}</b>
                  <small>{d.d}</small>
                </span>
              </button>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
function Timeline() {
  const [ref, seen] = useInView<HTMLDivElement>(0.25)
  const [tax, setTax] = useState(12000)
  const eligible = tax >= 3000
  const part = tax / 3

  return (
    <div ref={ref} className={seen ? 'lw-seen' : ''}>
      <div className="lw-tl">
        <div className="lw-tl-line"><i /></div>
        <div className="lw-tl-node n1">
          <span className="dot" />
          <b>31 มี.ค.</b>
          <small>2570</small>
          <p>ยื่นแบบกระดาษ</p>
        </div>
        <div className="lw-tl-node n2">
          <span className="dot" />
          <b>8 เม.ย.</b>
          <small>2570</small>
          <p>ยื่นแบบออนไลน์ (E-Filing)</p>
        </div>
      </div>

      <Reveal className="lw-inst">
        <header>
          <h3>ผ่อนชำระภาษี 3 งวด ไม่มีดอกเบี้ย</h3>
          <p>หากมีภาษีที่ต้องชำระตั้งแต่ <strong>3,000 บาทขึ้นไป</strong> สามารถขอผ่อนชำระได้ 3 งวดเท่า ๆ กัน</p>
        </header>
        <label>
          <span>ภาษีที่ต้องชำระ (บาท)</span>
          <input type="number" min="0" step="1000" value={tax} onChange={(e) => setTax(Math.max(0, Number(e.target.value)))} />
        </label>

        {eligible ? (
          <ol className="lw-inst-steps">
            {[
              ['งวดที่ 1', 'ชำระพร้อมยื่นแบบ'],
              ['งวดที่ 2', 'ชำระเดือนถัดไป'],
              ['งวดที่ 3', 'ชำระถัดไปอีก 1 เดือน'],
            ].map(([a, b], k) => (
              <li key={a} style={{ ['--k' as string]: k }}>
                <span className="coin">{k + 1}</span>
                <b>฿{baht(part)}</b>
                <small>{a}</small>
                <em>{b}</em>
              </li>
            ))}
          </ol>
        ) : (
          <p className="lw-inst-no">ยอดนี้ต่ำกว่า 3,000 บาท ยังไม่เข้าเงื่อนไขการผ่อนชำระ</p>
        )}
      </Reveal>
    </div>
  )
}

/* ------------------------------------------------------------------ */
export default function TaxLawComplianceView({ onCalculate }: LawProps) {
  return (
    <div className="lw">
      <div className="fx-orb fx-orb-a" aria-hidden="true" />
      <div className="fx-orb fx-orb-b" aria-hidden="true" />

      <header className="lw-hero">
        <svg className="lw-scale" viewBox="0 0 120 110" aria-hidden="true">
          <path d="M60 100V22M38 100h44" className="base" />
          <g className="beam">
            <path d="M16 30h88" />
            <path d="M16 30l-10 34h20zM104 30l-10 34h20z" />
            <path d="M6 64a10 6 0 0020 0M94 64a10 6 0 0020 0" />
          </g>
          <circle cx="60" cy="18" r="5" className="pivot" />
        </svg>
        <p className="fx-eyebrow">Legal Compliance &amp; Tax Laws</p>
        <h1>
          กฎหมายภาษี<i>.</i>
        </h1>
        <p className="lw-hero-sub">
          รวมข้อกฎหมาย สิทธิ บทลงโทษเกี่ยวกับการหนี้/เลี่ยงภาษี และขั้นตอนปฏิบัติตามกฎหมายสรรพากรอย่างถูกต้อง
        </p>
        <span className="lw-chip">ประมวลรัษฎากร · ภ.ง.ด.91</span>
      </header>

      <Reveal className="lw-warn">
        <div className="lw-tape" aria-hidden="true"><i /></div>
        <div className="lw-warn-body">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18v.5" /></svg>
          <div>
            <h3>คำเตือนเรื่องการหลีกเลี่ยงภาษี (Tax Evasion Refusal)</h3>
            <p>
              ระบบคำนวณและจัดทำขึ้นเพื่อส่งเสริมการวางแผนภาษีอย่างถูกต้องตามกฎหมาย (Tax Avoidance / Planning){' '}
              <strong>ไม่สนับสนุนและไม่ให้คำแนะนำเกี่ยวกับการปกปิดรายได้ การแจ้งข้อมูลเท็จ หรือการหลีกเลี่ยงภาษี (Tax Evasion) ทุกกรณี</strong>
            </p>
          </div>
        </div>
        <div className="lw-tape" aria-hidden="true"><i /></div>
      </Reveal>

      <section className="lw-sec">
        <SectionHead no="01" title="โทษเมื่อเจตนาหนี้ภาษี / เลี่ยงภาษี" sub="ยิ่งทำผิดมาก ยิ่งหนัก — ลองใส่ยอดภาษีของคุณเพื่อดูตัวเลขจริง" />
        <Penalties />
      </section>

      <section className="lw-sec">
        <SectionHead no="02" title="วางแผนภาษี VS เลี่ยงภาษี" sub="เส้นแบ่งระหว่าง “ถูกกฎหมาย” กับ “ผิดกฎหมาย”" />
        <Versus />
      </section>

      <section className="lw-sec">
        <SectionHead no="03" title="เก็บเอกสารหลักฐานให้ครบ" sub="แตะรายการเพื่อติ๊กว่าคุณเตรียมแล้ว" />
        <Docs />
      </section>

      <section className="lw-sec">
        <SectionHead no="04" title="กำหนดเวลายื่นแบบและการผ่อนชำระ" sub="ภาษีเงินได้ประจำปี 2569 ยื่นในปี 2570" />
        <Timeline />
      </section>

      {onCalculate && (
        <Reveal className="fx-cta">
          <p>เข้าใจกฎแล้ว ไปคำนวณภาษีของคุณกันเลย</p>
          <button type="button" onClick={onCalculate}>
            เริ่มคำนวณ <span aria-hidden="true">→</span>
          </button>
        </Reveal>
      )}

      <p className="lw-foot">
        * ข้อมูลกฎหมายและเกณฑ์ภาษีนี้อ้างอิงจากประมวลรัษฎากร กรมสรรพากร ประเทศไทย สามารถตรวจสอบข้อมูลล่าสุดได้ที่ www.rd.go.th
      </p>
    </div>
  )
}
