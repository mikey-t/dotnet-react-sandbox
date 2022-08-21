import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [forecasts, setForecasts] = useState<any[]>([])
  
  const getForecasts = async () => {
    setForecasts([])
    let res = await fetch('/api/WeatherForecast')
    let data = await res.json()
    if (Array.isArray(data)) {
      setForecasts(data)
    } else {
      console.log('unexpected format:')
      console.log(data)
    }
  }

  return (
    <div className="App">
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <p>Test proxy functionality:</p>
      <div>
        <button onClick={getForecasts}>Get Random Forecasts</button>
      </div>
      {forecasts.length > 0 && <div>
        {forecasts.map((f, i) => {
          return <p key={i}>{JSON.stringify(f)}</p>
        })}
      </div>}
    </div>
  )
}

export default App
