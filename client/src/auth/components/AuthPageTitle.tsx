import Typography from '@mui/material/Typography/Typography'
import { ReactNode } from 'react'

export default function AuthPageTitle({ children }: { children: ReactNode }) {
  return (
    <Typography variant="h4" component="h1" gutterBottom sx={{ mt: '1rem' }}>
      {children}
    </Typography>
  )
}
