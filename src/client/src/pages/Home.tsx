import {useState} from 'react'
import Button from '@mui/material/Button'

export default function Home() {
  return (
    <div>
      <h1>Home</h1>
      
      <ApiTestWidget/>
    </div>
  )
}

function ApiTestWidget() {
  const [forecasts, setForecasts] = useState<any[]>([])

  const getForecasts = async () => {
    setForecasts([])
    let res = await fetch('/api/WeatherForecast')
    let data = await res.json()
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

