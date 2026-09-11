export function LineChart({ values, color }) {
  const W = 100
  const H = 100
  const pad = 8
  const scale = values.length ? Math.max(...values.map(Math.abs), 0.0001) * 1.15 : 1
  const step = values.length > 1 ? W / (values.length - 1) : W

  const points = values
    .map((v, i) => {
      const x = i * step
      const y = H / 2 - (v / scale) * (H / 2 - pad)
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <svg
      className="line-chart"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
    >
      <line x1="0" y1={H / 2} x2={W} y2={H / 2} className="line-chart__zero" />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}