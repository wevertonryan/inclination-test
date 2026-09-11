const COUNT = 64

function hashString(str) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

function valueAt(rng, phase, amp, dc) {
  return (
    dc +
    Math.sin(phase) * amp * 0.75 +
    Math.sin(phase * 0.33 + 1.7) * amp * 0.35 +
    (rng() * 2 - 1) * amp * 0.2
  )
}

export function syntheticSeries(id, axisValue) {
  const rng = hashString(String(id))
  const series = []
  for (let i = 0; i < COUNT; i++) {
    const phase = (i / COUNT) * Math.PI * 4 + id.length * 0.7
    series.push(valueAt(rng, phase, axisValue.std, axisValue.mean))
  }
  return series
}