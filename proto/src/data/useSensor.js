import { useEffect, useRef, useState } from 'react'

const HZ = 12
const HISTORY = 64
const STEP_MS = Math.round(1000 / HZ)

function noise(amp) {
  return (Math.random() * 2 - 1) * amp
}

function raw(t, offset, amp, period) {
  return (
    Math.sin(t / period + offset) * amp +
    Math.sin(t / (period * 0.37) + offset * 2.1) * amp * 0.25 +
    noise(amp * 0.15)
  )
}

export function sampleAt(t) {
  return {
    x: raw(t, 0, 22, 900),
    y: raw(t, 1.7, 9, 1450),
    z: raw(t, 0.6, 6, 720),
  }
}

export function magnitude(s) {
  return Math.sqrt(s.x * s.x + s.y * s.y + s.z * s.z)
}

export function computeStats(samples) {
  const axis = ['x', 'y', 'z']
  const mean = { x: 0, y: 0, z: 0 }
  const std = { x: 0, y: 0, z: 0 }
  const length = samples.length
  if (!length) return { mean, std, length }

  for (const s of samples) {
    mean.x += s.x
    mean.y += s.y
    mean.z += s.z
  }
  for (const k of axis) mean[k] /= length

  for (const s of samples) {
    for (const k of axis) std[k] += (s[k] - mean[k]) ** 2
  }
  for (const k of axis) std[k] = Math.sqrt(std[k] / length)

  return { mean, std, length }
}

export function useSensor(active = true) {
  const [data, setData] = useState(() => {
    const now = Date.now()
    const out = []
    for (let i = HISTORY - 1; i >= 0; i--) {
      out.push(sampleAt(now - i * STEP_MS))
    }
    return out
  })

  const activeRef = useRef(active)
  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    const id = setInterval(() => {
      if (!activeRef.current) return
      setData((prev) => [...prev.slice(1), sampleAt(Date.now())])
    }, STEP_MS)
    return () => clearInterval(id)
  }, [])

  return data
}