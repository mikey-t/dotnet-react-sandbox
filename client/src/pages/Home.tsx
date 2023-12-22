import { useState } from 'react'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box/Box'
import Link from '@mui/material/Link/Link'
import PageTitle from '../components/PageTitle'

export default function Home() {
  return (
    <Box>
      <PageTitle>Home</PageTitle>
      <p>This is a <Link href="/test-link">test link</Link> that goes nowhere.</p>
      <ApiTestWidget />
    </Box>
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
    <Box>
      <Button variant="outlined" color="inherit" onClick={getForecasts}>Get Random Forecasts</Button><br />
      {forecasts.length > 0 && <div>
        {forecasts.map((f, i) => {
          return <p key={i}>{JSON.stringify(f)}</p>
        })}
      </div>}
    </Box>
  )
}

