import { useState } from 'react'
import { ScreenHeader } from '../components/ScreenHeader.jsx'
import Modal from '../components/Modal.jsx'
import { LineChart } from '../components/LineChart.jsx'
import {
  ChevronLeftIcon,
  DotsIcon,
  TrashIcon,
  PdfIcon,
} from '../components/icons.jsx'
import { syntheticSeries } from '../data/reportSeries.js'
import { axisScale, timeLabels } from '../data/chartAxes.js'
import '../components/ScreenHeader.css'
import '../components/Modal.css'
import './Relatorio.css'

const TRIM_COLOR = '#4aa3ff'
const ROLL_COLOR = '#f5a623'

const pad2 = (n) => String(n).padStart(2, '0')

function fmtDate(iso) {
  const d = new Date(iso)
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

function fmtTime(iso) {
  const d = new Date(iso)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
}

function fmtDuration(ms) {
  const total = Math.max(0, Math.round(ms / 1000))
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`
}

function deg(value) {
  return `${value.toFixed(1).replace('.', ',')}°`
}

function InfoLine({ label, children }) {
  return (
    <div className="rep-info__line">
      <span className="rep-info__label">{label}</span>
      <span className="rep-info__value">{children}</span>
    </div>
  )
}

function RangeAngle({ min, max }) {
  const lo = Math.max(-90, Math.min(90, min))
  const hi = Math.max(-90, Math.min(90, max))
  const value = hi - lo
  const cx = 100
  const cy = 96
  const r = 74
  const pt = (a) => {
    const rad = ((90 - a) * Math.PI) / 180
    return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)]
  }
  const [loX, loY] = pt(lo)
  const [hiX, hiY] = pt(hi)
  return (
    <div className="rep-angle">
      <svg viewBox="0 0 200 110" className="rep-angle__gauge">
        <path
          d="M 26 96 A 74 74 0 0 1 174 96"
          fill="none"
          stroke="var(--border)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d={`M ${loX} ${loY} A 74 74 0 0 1 ${hiX} ${hiY}`}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <line
          x1={cx}
          y1={cy}
          x2={loX}
          y2={loY}
          stroke="var(--accent)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <line
          x1={cx}
          y1={cy}
          x2={hiX}
          y2={hiY}
          stroke="var(--accent)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx={loX} cy={loY} r="4" fill="var(--accent)" />
        <circle cx={hiX} cy={hiY} r="4" fill="var(--accent)" />
        <circle cx={cx} cy={cy} r="7" fill="var(--accent)" />
      </svg>
      <span className="rep-angle__value">{deg(value)}</span>
      <span className="rep-angle__caption">Abertura (máx − mín)</span>
    </div>
  )
}

function TrimRollChart({ report }) {
  const trimSeries = syntheticSeries(`${report.id}t`, { mean: report.mean.y, std: report.std.y })
  const rollSeries = syntheticSeries(`${report.id}r`, { mean: report.mean.x, std: report.std.x })

  const scale = axisScale([...trimSeries, ...rollSeries])
  const yTicks = []
  for (let v = -scale; v <= scale; v += 10) yTicks.push(v)

  return (
    <div className="rep-chart">
      <div className="rep-chart__top">
        <span className="rep-chart__name">Trim × Roll</span>
        <span className="home-rec__legend">
          <span className="home-rec__key">
            <i className="home-rec__dot" style={{ background: TRIM_COLOR }} />
            Trim
          </span>
          <span className="home-rec__key">
            <i className="home-rec__dot" style={{ background: ROLL_COLOR }} />
            Roll
          </span>
        </span>
      </div>
      <div className="home-rec__plot">
        <div className="home-rec__yaxis">
          {yTicks.map((t) => (
            <span
              key={t}
              className="home-rec__yval"
              style={{ top: `${50 - (t / scale) * 42}%` }}
            >
              {`${t}°`}
            </span>
          ))}
        </div>
        <LineChart scale={scale} series={[
          { values: trimSeries, color: TRIM_COLOR },
          { values: rollSeries, color: ROLL_COLOR },
        ]} />
      </div>
      <div className="home-rec__xaxis">
        {timeLabels(report.durationMs).map((label) => (
          <span key={label} className="home-rec__xval">
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

function MenuOption({ Icon, label, tone, onClick }) {
  return (
    <button
      type="button"
      className={`rep-menu__option rep-menu__option--${tone}`}
      onClick={onClick}
    >
      <Icon className="rep-menu__icon" />
      {label}
    </button>
  )
}

function Relatorio({ report, onBack, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toast, setToast] = useState(false)

  const RAW_COUNT = 48
  const rollSeries = syntheticSeries(`${report.id}r`, { mean: report.mean.x, std: report.std.x })
  const rollMin = Math.min(...rollSeries)
  const rollMax = Math.max(...rollSeries)
  const rawX = syntheticSeries(`${report.id}rx`, { mean: report.mean.x, std: report.std.x })
  const rawY = syntheticSeries(`${report.id}ry`, { mean: report.mean.y, std: report.std.y })
  const rawZ = syntheticSeries(`${report.id}rz`, { mean: report.mean.z, std: report.std.z })
  const rawRows = Array.from({ length: RAW_COUNT }, (_, i) => ({
    n: pad2(i + 1),
    x: rawX[i],
    y: rawY[i],
    z: rawZ[i],
  }))

  function exportPdf() {
    setMenuOpen(false)
    setToast(true)
    setTimeout(() => setToast(false), 2200)
  }

  return (
    <>
      <ScreenHeader
        title="Relatório"
        left={
          <button
            type="button"
            className="rep-back"
            onClick={onBack}
            aria-label="Voltar"
          >
            <ChevronLeftIcon />
          </button>
        }
        right={
          <button
            type="button"
            className="rep-dots"
            onClick={() => setMenuOpen(true)}
            aria-label="Opções"
          >
            <DotsIcon />
          </button>
        }
      />

      <div className="rel-body">
        <div className="rep-info">
          <h2 className="rep-info__title">{report.title}</h2>
          <div className="rep-info__div" />
          <InfoLine label="Localização">{report.location || '—'}</InfoLine>
          <InfoLine label="Data">{fmtDate(report.date)}</InfoLine>
          <InfoLine label="Hora">{fmtTime(report.date)}</InfoLine>
          <div className="rep-info__div" />
          <InfoLine label="Tempo registrado">
            {fmtDuration(report.durationMs)}
          </InfoLine>
        </div>

        <h3 className="rel-section">Informações da gravação</h3>
        <RangeAngle min={rollMin} max={rollMax} />

        <TrimRollChart report={report} />

        <div className="rep-measures">
          <div className="rep-measures__row rep-measures__head">
            <span />
            <span>Média</span>
            <span>Desvio</span>
          </div>
          {[
            ['Trim', report.mean.y, report.std.y, TRIM_COLOR],
            ['Roll', report.mean.x, report.std.x, ROLL_COLOR],
          ].map(([name, mean, std, color]) => (
            <div key={name} className="rep-measures__row">
              <span className="rep-measures__name" style={{ color }}>
                {name}
              </span>
              <span>{deg(mean)}</span>
              <span>{deg(std)}</span>
            </div>
          ))}
        </div>

        <div className="rep-section-head">
          <h3 className="rel-section">Dados brutos</h3>
          <span className="rep-raw__count">
            {RAW_COUNT} leituras · ~1/10s
          </span>
        </div>
        <div className="rep-raw">
          <div className="rep-raw__row rep-raw__head">
            <span>Nº</span>
            <span>X</span>
            <span>Y</span>
            <span>Z</span>
          </div>
          <div className="rep-raw__list">
            {rawRows.map((row) => (
              <div key={row.n} className="rep-raw__row">
                <span className="rep-raw__n">{row.n}</span>
                <span>{deg(row.x)}</span>
                <span>{deg(row.y)}</span>
                <span>{deg(row.z)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={menuOpen} backdrop onClose={() => setMenuOpen(false)}>
        <h2 className="modal__title">Opções do relatório</h2>
        <div className="rep-menu__list">
          <MenuOption
            Icon={TrashIcon}
            label="Excluir"
            tone="danger"
            onClick={() => {
              setMenuOpen(false)
              setConfirmOpen(true)
            }}
          />
          <MenuOption
            Icon={PdfIcon}
            label="Exportar PDF"
            tone="default"
            onClick={exportPdf}
          />
        </div>
      </Modal>

      <Modal open={confirmOpen} backdrop onClose={() => setConfirmOpen(false)}>
        <h2 className="modal__title">Excluir relatório?</h2>
        <p className="modal__text">Esta ação não pode ser desfeita.</p>
        <div className="modal__actions">
          <button
            type="button"
            className="modal__btn modal__btn--ghost"
            onClick={() => setConfirmOpen(false)}
          >
            Voltar
          </button>
          <button
            type="button"
            className="modal__btn modal__btn--danger"
            onClick={() => {
              setConfirmOpen(false)
              onDelete()
            }}
          >
            Excluir
          </button>
        </div>
      </Modal>

      {toast && <div className="rep-toast">PDF exportado</div>}
    </>
  )
}

export default Relatorio