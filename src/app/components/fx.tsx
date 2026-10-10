'use client'

import React, { useEffect, useRef, useState } from 'react'

/** Becomes true (and stays true) once the element scrolls into view. */
export function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, seen] as const
}

/** Smoothly animates a displayed number towards `target` whenever it changes. */
export function useTween(target: number, run = true, duration = 650) {
  const [value, setValue] = useState(0)
  const current = useRef(0)
  useEffect(() => {
    if (!run) return
    let raf = 0
    const from = current.current
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      current.current = from + (target - from) * eased
      setValue(current.current)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, run, duration])
  return run ? value : 0
}

export const baht = (n: number) => Math.round(n).toLocaleString('th-TH')

interface RevealProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

/** Fades + lifts its children in when scrolled into view. */
export function Reveal({ children, delay = 0, className = '' }: RevealProps) {
  const [ref, seen] = useInView<HTMLDivElement>(0.12)
  return (
    <div
      ref={ref}
      className={`rv ${seen ? 'is-in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

interface SectionHeadProps {
  no: string
  title: string
  sub?: string
}

export function SectionHead({ no, title, sub }: SectionHeadProps) {
  return (
    <Reveal className="fx-head">
      <span className="fx-no" aria-hidden="true">{no}</span>
      <div>
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      <i className="fx-head-line" aria-hidden="true" />
    </Reveal>
  )
}
