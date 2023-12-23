import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export default function RequireNotAuth({ children }: { children: JSX.Element }) {
  const auth = useAuth()

  if (auth.user) {
    return <Navigate to="/" />
  }

  return children
}
