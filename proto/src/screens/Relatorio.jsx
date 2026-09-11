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
import { magnitude } from '../data/useSensor.js'
import '../components/ScreenHeader.css'
import '../components/Modal.css'
import './Relatorio.css'

const AXIS_COLORS = { x: '#f5a623', y: '#4aa3ff', z: '#34c98a' }
const ABS_COLOR = '#f5a623'

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

function BigAngle({ value }) {
  const angle = Math.max(-90, Math.min(90, value))
  const rad = ((90 - angle) * Math.PI) / 180
  const cx = 100
  const cy = 96
  const r = 74
  const tipX = cx + r * Math.cos(rad)
  const tipY = cy - r * Math.sin(rad)
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
        <line
          x1={cx}
          y1={cy}
          x2={tipX}
          y2={tipY}
          stroke="var(--accent)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="7" fill="var(--accent)" />
      </svg>
      <span className="rep-angle__value">{deg(value)}</span>
    </div>
  )
}

function SeriesChart({ title, value, color, series }) {
  return (
    <div className="rep-chart">
      <div className="rep-chart__top">
        <span className="rep-chart__name">{title}</span>
        <span className="rep-chart__value" style={{ color }}>
          {deg(value)}
        </span>
      </div>
      <LineChart values={series} color={color} />
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

  const absMean = magnitude(report.mean)
  const absStd = magnitude(report.std)

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
        <BigAngle value={report.mean.x} />

        <div className="rep-charts">
          <SeriesChart title="X" value={report.mean.x} color={AXIS_COLORS.x} series={syntheticSeries(`${report.id}x`, { mean: report.mean.x, std: report.std.x })} />
          <SeriesChart title="Y" value={report.mean.y} color={AXIS_COLORS.y} series={syntheticSeries(`${report.id}y`, { mean: report.mean.y, std: report.std.y })} />
          <SeriesChart title="Z" value={report.mean.z} color={AXIS_COLORS.z} series={syntheticSeries(`${report.id}z`, { mean: report.mean.z, std: report.std.z })} />
          <SeriesChart title="Absoluto" value={absMean} color={ABS_COLOR} series={syntheticSeries(`${report.id}a`, { mean: absMean, std: absStd })} />
        </div>

        <div className="rep-measures">
          <div className="rep-measures__row rep-measures__head">
            <span />
            <span>Média</span>
            <span>Desvio</span>
          </div>
          {[
            ['X', report.mean.x, report.std.x],
            ['Y', report.mean.y, report.std.y],
            ['Z', report.mean.z, report.std.z],
            ['Absoluto', absMean, absStd],
          ].map(([name, mean, std]) => (
            <div key={name} className="rep-measures__row">
              <span className="rep-measures__name">{name}</span>
              <span>{deg(mean)}</span>
              <span>{deg(std)}</span>
            </div>
          ))}
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