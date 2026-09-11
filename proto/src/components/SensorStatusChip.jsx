import {
  SensorIcon,
  CheckIcon,
  CrossIcon,
  QuestionIcon,
  ExclamationIcon,
} from './icons.jsx'
import './SensorStatusChip.css'

const STATUS_ICONS = {
  ok: { Icon: CheckIcon, label: 'Calibrado' },
  uncalibrated: { Icon: CrossIcon, label: 'Não calibrado' },
  unknown: { Icon: QuestionIcon, label: 'Não identificado' },
  error: { Icon: ExclamationIcon, label: 'Erro na calibragem' },
}

function SensorStatusChip({ status, onClick }) {
  const { Icon, label } = STATUS_ICONS[status] ?? STATUS_ICONS.unknown
  return (
    <button
      type="button"
      className="sensor-chip"
      onClick={onClick}
      aria-label={`${label}. Tocar para calibrar`}
    >
      <SensorIcon className="sensor-chip__sensor" />
      <span className={`sensor-chip__status sensor-chip__status--${status}`}>
        <Icon />
      </span>
    </button>
  )
}

export default SensorStatusChip