import { useState } from 'react'
import NavBar from './components/NavBar.jsx'
import Home from './screens/Home.jsx'
import Calibracao from './screens/Calibracao.jsx'
import Relatorios from './screens/Relatorios.jsx'
import Testes from './screens/Testes.jsx'
import Configuracoes from './screens/Configuracoes.jsx'
import './App.css'

function App() {
  const [screen, setScreen] = useState('home')
  const [sensorStatus, setSensorStatus] = useState('ok')
  const [immersive, setImmersive] = useState(false)
  const [reports, setReports] = useState([])

  const addReport = (report) => setReports((prev) => [report, ...prev])

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
    relatorios: <Relatorios reports={reports} onNavigate={setScreen} />,
    testes: <Testes />,
    configuracoes: <Configuracoes />,
  }

  return (
    <div className="app">
      <main className="app-screen">{screens[screen]}</main>
      <NavBar active={screen} onChange={setScreen} hidden={immersive} />
    </div>
  )
}

export default App