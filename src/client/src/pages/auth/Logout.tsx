import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../components/auth/AuthProvider'

export default function Logout() {
  const auth = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    auth.logout(() => navigate('/'))
  }, [auth, navigate])
  return (
    <Box sx={{ display: 'flex', pt: '30px' }}>
      <CircularProgress sx={{ m: 'auto' }} />
    </Box>
  )
}

