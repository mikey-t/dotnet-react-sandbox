import { useState } from 'react'
import Button from '@mui/material/Button'

export default function Home() {
  return (
    <div>
      <h1>Home</h1>

      <ApiTestWidget />
    </div>
  )
}

interface WeatherForecast {
  date: string
  temperatureC: number
  temperatureF: number
  summary?: string
}

function ApiTestWidget() {
  const [forecasts, setForecasts] = useState<WeatherForecast[]>([])

  const getForecasts = async () => {
    setForecasts([])
    const res = await fetch('/api/WeatherForecast')
    const data = await res.json()
    if (Array.isArray(data)) {
      setForecasts(data)
    } else {
      console.log(data)
    }
  }

  return (
    <>
      <Button variant="outlined" color="inherit" onClick={getForecasts}>Get Random Forecasts</Button><br />
      {forecasts.length > 0 && <div>
        {forecasts.map((f, i) => {
          return <p key={i}>{JSON.stringify(f)}</p>
        })}
      </div>}
    </>
  )
}

