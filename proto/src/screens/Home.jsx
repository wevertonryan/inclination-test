import { useEffect, useRef, useState } from 'react'
import { ScreenHeader } from '../components/ScreenHeader.jsx'
import SensorStatusChip from '../components/SensorStatusChip.jsx'
import Modal from '../components/Modal.jsx'
import { LineChart } from '../components/LineChart.jsx'
import Inclinometer from '../components/Inclinometer.jsx'
import { CrossIcon, CheckIcon } from '../components/icons.jsx'
import { useSensor, toPose, computeStats, ROLL_AXIS, TRIM_AXIS } from '../data/useSensor.js'
import '../components/ScreenHeader.css'
import '../components/Modal.css'
import './Home.css'

const TRIM_COLOR = '#4aa3ff'
const ROLL_COLOR = '#f5a623'
const EXIT_MS = 230

function pad2(n) {
  return String(n).padStart(2, '0')
}

function pad3(n) {
  return String(n).padStart(3, '0')
}

function formatTimer(ms) {
  return `${pad2(Math.floor(ms / 60000))}:${pad2(Math.floor((ms % 60000) / 1000))} · ${pad3(ms % 1000)}`
}

function clock(ms) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${pad2(s % 60)}`
}

function axisScale(values) {
  const max = values.reduce((m, v) => Math.max(m, Math.abs(v)), 0)
  return Math.max(10, Math.ceil(max / 10) * 10)
}

function timeLabels(ms) {
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

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `r-${Date.now()}-${Math.random()}`
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

  const modeRef = useRef(mode)
  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  const [recorded, setRecorded] = useState([])
  const data = useSensor(true, (sample) => {
    if (modeRef.current !== 'recording') return
    setRecorded((prev) => [...prev, sample])
  })
  const baseMs = useRef(0)
  const runStart = useRef(0)
  const exitTimer = useRef(null)

  const immersive = mode !== 'idle' || exiting
  useEffect(() => {
    onImmersiveChange(immersive)
  }, [immersive, onImmersiveChange])

  useEffect(() => {
    if (mode !== 'recording') return
    const id = setInterval(() => {
      setElapsed(baseMs.current + (Date.now() - runStart.current))
    }, 16)
    return () => clearInterval(id)
  }, [mode])

  useEffect(() => () => clearTimeout(exitTimer.current), [])

  function startRecording() {
    setRecorded([])
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
    setRecorded([])
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
    const { mean, std, length } = computeStats(recorded)
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
  const pose = toPose(data[data.length - 1])
  const trimSeries = recorded.map((s) => s[TRIM_AXIS])
  const rollSeries = recorded.map((s) => s[ROLL_AXIS])

  const scale = axisScale([...trimSeries, ...rollSeries])
  const yTicks = []
  for (let v = -scale; v <= scale; v += 10) yTicks.push(v)

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
        <Inclinometer roll={pose.roll} trim={pose.trim} />

        {showOverlay && (
          <div className={`home-rec ${exiting ? 'home-rec--exit' : ''}`}>
            <div className="home-rec__top">
              <span className="home-rec__name">Trim × Roll</span>
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
              {timeLabels(elapsed).map((label) => (
                <span key={label} className="home-rec__xval">
                  {label}
                </span>
              ))}
            </div>
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