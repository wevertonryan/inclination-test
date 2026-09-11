import { useEffect, useRef, useState } from 'react'
import { ScreenHeader } from '../components/ScreenHeader.jsx'
import Modal from '../components/Modal.jsx'
import {
  SensorIcon,
  CheckIcon,
  CrossIcon,
  QuestionIcon,
  ExclamationIcon,
  SpinnerIcon,
  WrenchIcon,
} from '../components/icons.jsx'
import '../components/ScreenHeader.css'
import '../components/Modal.css'
import './Calibracao.css'

const SENSORS = [
  { id: 'acelerometro', name: 'Acelerômetro', initial: 'ok' },
  { id: 'giroscopio', name: 'Giroscópio', initial: 'uncalibrated' },
  { id: 'magnetometro', name: 'Magnetômetro', initial: 'unknown' },
  { id: 'barometro', name: 'Barômetro', initial: 'error' },
  { id: 'gps', name: 'GPS', initial: 'uncalibrated' },
]

const STATUS_MAP = {
  ok: { Icon: CheckIcon, label: 'Calibrado' },
  uncalibrated: { Icon: CrossIcon, label: 'Não calibrado' },
  unknown: { Icon: QuestionIcon, label: 'Não identificado' },
  error: { Icon: ExclamationIcon, label: 'Erro na calibragem' },
  calibrating: { Icon: SpinnerIcon, label: 'Calibrando' },
}

const CALIBRATE_STEP_MS = 650
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const STATUS_INFO = {
  ok: 'Este sensor está calibrado e pronto para uso.',
  uncalibrated: 'Este sensor precisa ser calibrado antes de realizar uma medição.',
  unknown: 'O sensor não foi encontrado ou não foi identificado neste dispositivo.',
  error: 'Ocorreu um problema ao tentar calibrar este sensor. Tente novamente.',
  calibrating: 'A calibração deste sensor está em andamento. Aguarde.',
}

function Calibracao({ onChangeStatus }) {
  const [statuses, setStatuses] = useState(() =>
    Object.fromEntries(SENSORS.map((s) => [s.id, s.initial])),
  )
  const [calibrating, setCalibrating] = useState(false)
  const [infoSensor, setInfoSensor] = useState(null)
  const statusesRef = useRef(statuses)
  const runId = useRef(0)

  useEffect(() => {
    statusesRef.current = statuses
  }, [statuses])

  useEffect(() => () => runId.current++, [])

  async function handleCalibrate() {
    if (calibrating) return
    setCalibrating(true)
    const myRun = ++runId.current
    const targets = SENSORS.filter((s) => statusesRef.current[s.id] !== 'unknown')

    for (const s of targets) {
      if (runId.current !== myRun) return
      setStatuses((prev) => ({ ...prev, [s.id]: 'calibrating' }))
      await wait(CALIBRATE_STEP_MS)
      if (runId.current !== myRun) return
      setStatuses((prev) => ({ ...prev, [s.id]: 'ok' }))
    }

    if (runId.current !== myRun) return
    setCalibrating(false)
    if (statusesRef.current.acelerometro === 'ok') {
      onChangeStatus('ok')
    }
  }

  return (
    <>
      <ScreenHeader title="Calibragem" />
      <div className="calib-body">
        <div className="calib-table">
          <div className="calib-table__head">
            <span>Sensor</span>
            <span>Status</span>
          </div>
          {SENSORS.map((sensor) => {
            const status = statuses[sensor.id]
            const { Icon, label } = STATUS_MAP[status]
            const calibratingNow = status === 'calibrating'
            return (
              <div key={sensor.id} className="calib-row">
                <div className="calib-row__left">
                  <SensorIcon className="calib-row__icon" />
                  <span className="calib-row__name">{sensor.name}</span>
                </div>
                <button
                  type="button"
                  className={`calib-row__status calib-row__status--${status}`}
                  aria-label={label}
                  onClick={() => setInfoSensor({ ...sensor, status })}
                >
                  {calibratingNow ? (
                    <Icon className="calib-spinner" />
                  ) : (
                    <Icon />
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        className="calib-btn"
        onClick={handleCalibrate}
        disabled={calibrating}
        aria-label="Calibrar sensores"
      >
        <WrenchIcon className="calib-btn__icon" />
      </button>

      <Modal
        open={infoSensor !== null}
        onClose={() => setInfoSensor(null)}
        backdrop={false}
      >
        {infoSensor && (
          <>
            <h2 className="modal__title">{infoSensor.name}</h2>
            <p className="modal__text">{STATUS_INFO[infoSensor.status]}</p>
          </>
        )}
      </Modal>
    </>
  )
}

export default Calibracao