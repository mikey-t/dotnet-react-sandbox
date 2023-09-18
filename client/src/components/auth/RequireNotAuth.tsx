import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { useEffect } from 'react'

export default function RequireNotAuth({ children }: { children: JSX.Element }) {
  const auth = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (auth.user !== null) {
      navigate('/')
    }
  }, [])

  return children
}
