import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export default function RequireNotAuth({ children }: { children: JSX.Element }) {
  const { user } = useAuth()

  if (user) {
    return <Navigate to="/" />
  }

  return children
}
