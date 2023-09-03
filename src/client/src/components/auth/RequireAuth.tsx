import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export default function RequireAuth({ children, role }: { children: JSX.Element, role?: string }) {
  const auth = useAuth()
  const location = useLocation()

  if (!auth.user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (role && !auth.user.roles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return children
}
