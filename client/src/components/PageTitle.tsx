import { Typography } from '@mui/material'
import { ReactNode } from 'react'

export default function PageTitle({ children }: {children: ReactNode}) {
  return (
    <Typography variant="h4" component="h1" gutterBottom sx={{ pt: '1rem' }}>
      {children}
    </Typography>
  )
}
