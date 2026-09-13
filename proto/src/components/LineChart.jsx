import './LineChart.css'

export function LineChart({ values, color, series, scale: fixedScale }) {
  const W = 100
  const H = 100
  const pad = 8

  const seriesList = series
    ? series
    : [{ values: values || [], color }]

  const allValues = seriesList.flatMap((s) => s.values)
  const autoScale = allValues.length
    ? Math.max(...allValues.map(Math.abs), 0.0001) * 1.15
    : 0
  const scale = fixedScale && fixedScale > 0 ? fixedScale : autoScale || 1

  function buildPoints(vals) {
    const step = vals.length > 1 ? W / (vals.length - 1) : W
    return vals
      .map((v, i) => {
        const x = i * step
        const y = H / 2 - (v / scale) * (H / 2 - pad)
        return `${x.toFixed(2)},${y.toFixed(2)}`
      })
      .join(' ')
  }

  return (
    <svg
      className="line-chart"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
    >
      <line x1="0" y1={H / 2} x2={W} y2={H / 2} className="line-chart__zero" />
      {seriesList.map((s, idx) => (
        <polyline
          key={idx}
          points={buildPoints(s.values)}
          fill="none"
          stroke={s.color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}