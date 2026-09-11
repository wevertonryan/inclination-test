import {
  HomeIcon,
  CalibrationIcon,
  ReportsIcon,
  TestsIcon,
  SettingsIcon,
} from './icons.jsx'
import './NavBar.css'

const TABS = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'calibracao', label: 'Calibragem', Icon: CalibrationIcon },
  { id: 'relatorios', label: 'Relatórios', Icon: ReportsIcon },
  { id: 'testes', label: 'Testes', Icon: TestsIcon },
  { id: 'configuracoes', label: 'Configurações', Icon: SettingsIcon },
]

function NavBar({ active, onChange, hidden = false }) {
  return (
    <nav className={`nav-bar ${hidden ? 'nav-bar--hidden' : ''}`}>
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`nav-item ${active === id ? 'nav-item--active' : ''}`}
          onClick={() => onChange(id)}
        >
          <Icon className="nav-icon" />
          <span className="nav-label">{label}</span>
        </button>
      ))}
    </nav>
  )
}

export default NavBar