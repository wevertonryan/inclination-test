import './Inclinometer.css'

const ROLL_COLOR = '#f5a623'
const TRIM_COLOR = '#4aa3ff'

const CX = 130
const CY = 130
const R = 112
const HOLE = 62
const TICK_OUT = 106
const TICK_IN_MAJOR = 96
const TICK_IN_MINOR = 101
const LABEL_R = 78
const STRIP_W = 46
const STRIP_HALF = 76
const RULER_MOVE = 52

function fmtDeg(v) {
  return `${v.toFixed(1).replace('.', ',')}°`
}

function polar(r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: CX + r * Math.cos(rad),
    y: CY - r * Math.sin(rad),
  }
}

function RollTicks() {
  const marks = []
  const sides = [1, -1]
  for (const dir of sides) {
    for (let v = 0; v <= 180; v += 10) {
      const major = v % 30 === 0
      const ang = 90 - dir * v
      const out = polar(TICK_OUT, ang)
      const inner = polar(major ? TICK_IN_MAJOR : TICK_IN_MINOR, ang)
      marks.push(
        <g key={`${dir}-${v}`}>
          <line
            x1={out.x}
            y1={out.y}
            x2={inner.x}
            y2={inner.y}
            className={`inclino__rtick ${major ? 'inclino__rtick--major' : ''}`}
          />
          {major && v !== 0 && (v !== 180 || dir === 1) && (
            <text
              x={polar(LABEL_R, ang).x}
              y={polar(LABEL_R, ang).y}
              className="inclino__rlabel"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {v}
            </text>
          )}
        </g>,
      )
    }
  }
  return marks
}

function RulerSlides() {
  const ticks = []
  const spacing = RULER_MOVE / 90
  for (let v = 0; v <= 90; v += 10) {
    const major = v % 30 === 0
    const off = v * spacing
    const yTop = CY - off
    const yBot = CY + off

    if (v === 0) {
      ticks.push(
        <g key="0">
          <line
            x1={CX - 12}
            y1={CY}
            x2={CX + 12}
            y2={CY}
            className="inclino__tick inclino__tick--major"
          />
        </g>,
      )
    } else {
      ticks.push(
        <g key={v}>
          <line
            x1={CX - 12}
            y1={yTop}
            x2={CX + 12}
            y2={yTop}
            className={`inclino__tick ${major ? 'inclino__tick--major' : ''}`}
          />
          <line
            x1={CX - 12}
            y1={yBot}
            x2={CX + 12}
            y2={yBot}
            className={`inclino__tick ${major ? 'inclino__tick--major' : ''}`}
          />
          {major && (
            <text
              x={CX - 19}
              y={yTop}
              className="inclino__tlabel"
              textAnchor="end"
              dominantBaseline="central"
            >
              {v}
            </text>
          )}
          {major && (
            <text
              x={CX - 19}
              y={yBot}
              className="inclino__tlabel"
              textAnchor="end"
              dominantBaseline="central"
            >
              {v}
            </text>
          )}
        </g>,
      )
    }
  }
  return ticks
}

const ANNULUS = `M ${CX} ${CY - R} A ${R} ${R} 0 1 1 ${CX} ${CY + R} A ${R} ${R} 0 1 1 ${CX} ${CY - R} Z
  M ${CX} ${CY - HOLE} A ${HOLE} ${HOLE} 0 1 0 ${CX} ${CY + HOLE} A ${HOLE} ${HOLE} 0 1 0 ${CX} ${CY - HOLE} Z`

function Inclinometer({ roll, trim }) {
  const trimPx = (trim / 90) * RULER_MOVE

  return (
    <div className="inclino">
      <svg viewBox="0 0 260 260" className="inclino__svg">
        <circle cx={CX} cy={CY} r={R} className="inclino__disc" />

        <g className="inclino__strip" transform={`translate(0, ${trimPx})`}>
          <rect
            x={CX - STRIP_W / 2}
            y={CY - STRIP_HALF}
            width={STRIP_W}
            height={STRIP_HALF * 2}
            rx="8"
            className="inclino__strip-bg"
          />
          {RulerSlides()}
        </g>

        <path d={ANNULUS} fillRule="evenodd" className="inclino__annulus" />
        <circle cx={CX} cy={CY} r={HOLE} className="inclino__hole-edge" />
        <circle cx={CX} cy={CY} r={R} className="inclino__case-edge" />

        <g className="inclino__roll-scale" transform={`rotate(${roll}, ${CX}, ${CY})`}>
          {RollTicks()}
        </g>

        <line
          x1={CX - HOLE + 8}
          y1={CY}
          x2={CX + HOLE - 8}
          y2={CY}
          className="inclino__trim-index"
        />
        <path
          d={`M ${CX - 9} ${CY - R - 4} L ${CX + 9} ${CY - R - 4} L ${CX} ${CY - R + 16} Z`}
          className="inclino__pointer"
        />
      </svg>

      <div className="inclino__legend">
        <span className="inclino__item">
          <i className="inclino__dot" style={{ background: TRIM_COLOR }} />
          TRIM {fmtDeg(trim)}
        </span>
        <span className="inclino__item">
          <i className="inclino__dot" style={{ background: ROLL_COLOR }} />
          ROLL {fmtDeg(roll)}
        </span>
      </div>
    </div>
  )
}

export default Inclinometer