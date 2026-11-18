const pad2 = (n) => String(n).padStart(2, '0')

export function clock(ms) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${pad2(s % 60)}`
}

export function axisScale(values) {
  const max = values.reduce((m, v) => Math.max(m, Math.abs(v)), 0)
  return Math.max(10, Math.ceil(max / 10) * 10)
}

export function timeLabels(ms) {
  const total = Math.floor(ms / 1000)
  if (!total) return ['0:00']
  let step = 1000
  if (total > 8) step = 5000
  if (total > 40) step = 10000
  if (total > 120) step = 30000
  if (total > 360) step = 60000
  const out = []
  for (let t = 0; t <= total * 1000; t += step) out.push(clock(t))
  const last = clock(total * 1000)
  if (out[out.length - 1] !== last) out.push(last)
  return out
}