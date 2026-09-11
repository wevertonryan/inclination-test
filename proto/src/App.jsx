import { useState } from 'react'
import NavBar from './components/NavBar.jsx'
import Home from './screens/Home.jsx'
import Calibracao from './screens/Calibracao.jsx'
import Relatorios from './screens/Relatorios.jsx'
import Relatorio from './screens/Relatorio.jsx'
import Testes from './screens/Testes.jsx'
import Configuracoes from './screens/Configuracoes.jsx'
import './App.css'

const SEED_REPORTS = [
  {
    id: 'r1',
    title: 'Prova de Inclinação',
    date: '2026-09-11T09:30:00.000Z',
    durationMs: 45000,
    location: 'Santos — Porto',
    mean: { x: 3.2, y: -1.1, z: 0.4 },
    std: { x: 0.9, y: 0.7, z: 0.3 },
    length: 540,
  },
  {
    id: 'r2',
    title: 'Prova de Mar',
    date: '2026-09-10T14:05:00.000Z',
    durationMs: 120000,
    location: 'São Paulo — Guarujá',
    mean: { x: -2.6, y: 1.8, z: 0.2 },
    std: { x: 2.4, y: 1.9, z: 0.6 },
    length: 1440,
  },
  {
    id: 'r3',
    title: 'Medição de Borda',
    date: '2026-09-08T08:20:00.000Z',
    durationMs: 21000,
    location: 'Rio de Janeiro',
    mean: { x: 1.1, y: 0.3, z: -0.2 },
    std: { x: 0.4, y: 0.5, z: 0.2 },
    length: 252,
  },
  {
    id: 'r4',
    title: 'Prova de Inclinação',
    date: '2026-09-05T16:45:00.000Z',
    durationMs: 4500,
    location: '',
    mean: { x: 0.8, y: 0.2, z: 0.1 },
    std: { x: 0.3, y: 0.2, z: 0.1 },
    length: 54,
  },
]

function App() {
  const [screen, setScreen] = useState('home')
  const [sensorStatus, setSensorStatus] = useState('ok')
  const [immersive, setImmersive] = useState(false)
  const [reports, setReports] = useState(SEED_REPORTS)
  const [reportId, setReportId] = useState(null)

  const addReport = (report) => setReports((prev) => [report, ...prev])

  function openReport(id) {
    setReportId(id)
    setScreen('report')
  }

  function deleteReport(id) {
    setReports((prev) => prev.filter((r) => r.id !== id))
    setReportId(null)
    setScreen('relatorios')
  }

  const currentReport =
    reportId != null ? reports.find((r) => r.id === reportId) : null

  const screens = {
    home: (
      <Home
        sensorStatus={sensorStatus}
        reports={reports}
        onNavigate={setScreen}
        onImmersiveChange={setImmersive}
        onSaveReport={addReport}
      />
    ),
    calibracao: (
      <Calibracao onNavigate={setScreen} onChangeStatus={setSensorStatus} />
    ),
    relatorios: (
      <Relatorios reports={reports} onNavigate={setScreen} onOpenReport={openReport} />
    ),
    report: currentReport ? (
      <Relatorio
        report={currentReport}
        onBack={() => setScreen('relatorios')}
        onDelete={() => deleteReport(reportId)}
      />
    ) : null,
    testes: <Testes />,
    configuracoes: <Configuracoes />,
  }

  const hideNav = immersive || screen === 'report'

  return (
    <div className="app">
      <main className="app-screen">{screens[screen]}</main>
      <NavBar active={screen} onChange={setScreen} hidden={hideNav} />
    </div>
  )
}

export default App