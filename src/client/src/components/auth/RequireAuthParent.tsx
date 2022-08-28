import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export default function RequireAuthParent() {
  const auth = useAuth()
  const location = useLocation()

  return auth.user ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />
}
