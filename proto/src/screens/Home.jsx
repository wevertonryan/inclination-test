import { useEffect, useRef, useState } from 'react'
import { ScreenHeader } from '../components/ScreenHeader.jsx'
import SensorStatusChip from '../components/SensorStatusChip.jsx'
import SegmentedControl from '../components/SegmentedControl.jsx'
import Modal from '../components/Modal.jsx'
import { LineChart } from '../components/LineChart.jsx'
import {
  ChartXYZIcon,
  ChartAbsIcon,
  CrossIcon,
  CheckIcon,
} from '../components/icons.jsx'
import { useSensor, magnitude, computeStats } from '../data/useSensor.js'
import '../components/ScreenHeader.css'
import '../components/Modal.css'
import './Home.css'

const AXIS_COLORS = { x: '#f5a623', y: '#4aa3ff', z: '#34c98a' }
const ABS_COLOR = '#f5a623'
const EXIT_MS = 230

const CHART_OPTIONS = [
  { id: 'xyz', label: 'XYZ', Icon: ChartXYZIcon },
  { id: 'abs', label: 'ABS', Icon: ChartAbsIcon },
]

function pad2(n) {
  return String(n).padStart(2, '0')
}

function pad3(n) {
  return String(n).padStart(3, '0')
}

function formatTimer(ms) {
  return `${pad2(Math.floor(ms / 60000))}:${pad2(Math.floor((ms % 60000) / 1000))} · ${pad3(ms % 1000)}`
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `r-${Date.now()}-${Math.random()}`
}

function ChartPanel({ title, value, color, values }) {
  return (
    <div className="home-chart">
      <div className="home-chart__top">
        <span className="home-chart__name">{title}</span>
        <span className="home-chart__value" style={{ color }}>
          {value.toFixed(1)}°
        </span>
      </div>
      <LineChart values={values} color={color} />
    </div>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="record-btn__play" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5z" fill="#fff" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="record-btn__pause" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1.5" fill="#fff" />
      <rect x="14" y="5" width="4" height="14" rx="1.5" fill="#fff" />
    </svg>
  )
}

function RecordButton({ mode, onClick }) {
  return (
    <button type="button" className="record-btn" onClick={onClick} aria-label={mode === 'recording' ? 'Pausar gravação' : 'Retomar gravação'}>
      {mode === 'recording' ? <PauseIcon /> : <PlayIcon />}
    </button>
  )
}

function RoundIconButton({ Icon, className, label, onClick }) {
  return (
    <button type="button" className={`round-btn ${className}`} onClick={onClick} aria-label={label}>
      <Icon className="round-btn__icon" />
    </button>
  )
}

function Home({ sensorStatus, onNavigate, onImmersiveChange, onSaveReport }) {
  const [mode, setMode] = useState('idle')
  const [exiting, setExiting] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [elapsed, setElapsed] = useState(0)

  const data = useSensor(mode === 'recording')
  const recorded = useRef([])
  const baseMs = useRef(0)
  const runStart = useRef(0)
  const exitTimer = useRef(null)

  const immersive = mode !== 'idle' || exiting
  useEffect(() => {
    onImmersiveChange(immersive)
  }, [immersive, onImmersiveChange])

  useEffect(() => {
    if (mode !== 'recording') return
    recorded.current.push(data[data.length - 1])
  }, [data, mode])

  useEffect(() => {
    if (mode !== 'recording') return
    const id = setInterval(() => {
      setElapsed(baseMs.current + (Date.now() - runStart.current))
    }, 16)
    return () => clearInterval(id)
  }, [mode])

  useEffect(() => () => clearTimeout(exitTimer.current), [])

  function startRecording() {
    recorded.current = []
    baseMs.current = 0
    runStart.current = Date.now()
    setElapsed(0)
    setMode('recording')
  }

  function pauseRecording() {
    baseMs.current += Date.now() - runStart.current
    setElapsed(baseMs.current)
    setMode('paused')
  }

  function resumeRecording() {
    runStart.current = Date.now()
    setMode('recording')
  }

  function resetAll() {
    recorded.current = []
    baseMs.current = 0
    setTitle('')
    setCancelOpen(false)
    setSaveOpen(false)
  }

  function exitToIdle() {
    setExiting(true)
    clearTimeout(exitTimer.current)
    exitTimer.current = setTimeout(() => {
      resetAll()
      setMode('idle')
      setExiting(false)
    }, EXIT_MS)
  }

  function handleSave() {
    const { mean, std, length } = computeStats(recorded.current)
    const fallback = `Medição ${new Date().toLocaleDateString('pt-BR')}`
    onSaveReport({
      id: uid(),
      title: title.trim() || fallback,
      date: new Date().toISOString(),
      durationMs: baseMs.current,
      mean,
      std,
      length,
    })
    exitToIdle()
  }

  const showOverlay = mode !== 'idle' || exiting
  const [chartMode, setChartMode] = useState('xyz')
  const last = data[data.length - 1]

  return (
    <>
      <ScreenHeader
        title="Medição"
        hidden={immersive}
        left={
          <SensorStatusChip
            status={sensorStatus}
            onClick={() => onNavigate('calibracao')}
          />
        }
      />
      <div className="home-body">
        <div className="home-toolbar">
          <SegmentedControl
            label="Tipo de gráfico"
            options={CHART_OPTIONS}
            value={chartMode}
            onChange={setChartMode}
          />
        </div>

        {chartMode === 'xyz' ? (
          <div className="home-charts">
            <ChartPanel title="X" value={last.x} color={AXIS_COLORS.x} values={data.map((d) => d.x)} />
            <ChartPanel title="Y" value={last.y} color={AXIS_COLORS.y} values={data.map((d) => d.y)} />
            <ChartPanel title="Z" value={last.z} color={AXIS_COLORS.z} values={data.map((d) => d.z)} />
          </div>
        ) : (
          <div className="home-charts">
            <ChartPanel
              title="Absoluto"
              value={magnitude(last)}
              color={ABS_COLOR}
              values={data.map(magnitude)}
            />
          </div>
        )}
      </div>

      {!showOverlay && (
        <button
          type="button"
          className="record-btn record-btn--idle"
          onClick={startRecording}
          aria-label="Gravar registro"
        >
          <span className="record-btn__core" />
        </button>
      )}

      {showOverlay && (
        <div className={`overlay ${exiting ? 'overlay--exit' : ''}`}>
          <div className="overlay__timer">
            {formatTimer(elapsed)}
          </div>
          <div className="overlay__bar">
            <RoundIconButton
              Icon={CrossIcon}
              className="round-btn--cancel"
              label="Cancelar gravação"
              onClick={() => setCancelOpen(true)}
            />
            <RecordButton
              mode={mode}
              onClick={mode === 'recording' ? pauseRecording : resumeRecording}
            />
            <RoundIconButton
              Icon={CheckIcon}
              className="round-btn--save"
              label="Salvar gravação"
              onClick={() => setSaveOpen(true)}
            />
          </div>
        </div>
      )}

      <Modal open={cancelOpen}>
        <h2 className="modal__title">Cancelar gravação?</h2>
        <p className="modal__text">
          Os dados registrados serão perdidos para sempre.
        </p>
        <div className="modal__actions">
          <button
            type="button"
            className="modal__btn modal__btn--ghost"
            onClick={() => setCancelOpen(false)}
          >
            Voltar
          </button>
          <button
            type="button"
            className="modal__btn modal__btn--danger"
            onClick={exitToIdle}
          >
            Cancelar gravação
          </button>
        </div>
      </Modal>

      <Modal open={saveOpen}>
        <h2 className="modal__title">Salvar gravação</h2>
        <input
          className="modal__input"
          placeholder="Nome da gravação"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <div className="modal__actions">
          <button
            type="button"
            className="modal__btn modal__btn--ghost"
            onClick={() => setSaveOpen(false)}
          >
            Voltar
          </button>
          <button
            type="button"
            className="modal__btn modal__btn--primary"
            onClick={handleSave}
          >
            Salvar
          </button>
        </div>
      </Modal>
    </>
  )
}

export default Home