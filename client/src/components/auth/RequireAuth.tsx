import { Navigate, useLocation } from 'react-router-dom'
import { UserRole } from '../../model/models'
import { useAuth } from './AuthProvider'

export default function RequireAuth({ children, role }: { children: JSX.Element, role?: UserRole }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (role && !user.hasRole(role)) {
    return <Navigate to="/" replace />
  }

  return children
}
