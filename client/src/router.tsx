import { RouteObject, createBrowserRouter } from 'react-router-dom'
import MainLayout from './layout/MainLayout'
import Blog from './pages/public/Blog'
import ContentPolicy from './pages/public/ContentPolicy'
import ErrorPage from './pages/public/ErrorPage'
import Home from './pages/public/Home'
import Pricing from './pages/public/Pricing'
import Privacy from './pages/public/Privacy'
import Products from './pages/public/Products'
import Terms from './pages/public/Terms'
import Login from './pages/auth/Login'
import Logout from './pages/auth/Logout'
import Account from './pages/protected/Account'
import RequireAuth from './components/auth/RequireAuth'
import RequireNotAuth from './components/auth/RequireNotAuth'
import SignUp from './pages/auth/SignUp'
import RegisterWithEmail from './pages/auth/RegisterWithEmail'
import VerifyEmail from './pages/auth/VerifyEmail'
import RegisterNext from './pages/auth/RegisterNext'
import RegisterResendEmail from './pages/auth/RegisterResendEmail'
import AdminHome from './pages/admin/AdminHome'
import Users from './pages/admin/Users'
import Whitelist from './pages/admin/Whitelist'
import AdminLayout from './layout/AdminLayout'

const routes: RouteObject[] = [
  {
    path: '/',
    id: 'root',
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [{
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          element: <Home />
        },
        {
          path: 'products',
          element: <Products />
        },
        {
          path: 'pricing',
          element: <Pricing />
        },
        {
          path: 'blog',
          element: <Blog />
        },
        {
          path: 'privacy',
          element: <Privacy />
        },
        {
          path: 'terms',
          element: <Terms />
        },
        {
          path: 'content-policy',
          element: <ContentPolicy />
        },
        {
          path: 'login',
          element: <RequireNotAuth><Login /></RequireNotAuth>
        },
        {
          path: 'sign-up',
          element: <RequireNotAuth><SignUp /></RequireNotAuth>
        },
        {
          path: 'register',
          element: <RequireNotAuth><RegisterWithEmail /></RequireNotAuth>
        },
        {
          path: 'verify-email',
          element: <RequireNotAuth><VerifyEmail /></RequireNotAuth>
        },
        {
          path: 'register-next',
          element: <RequireNotAuth><RegisterNext /></RequireNotAuth>
        },
        {
          path: 'register-resend-email',
          element: <RequireNotAuth><RegisterResendEmail /></RequireNotAuth>
        },
        {
          path: 'logout',
          element: <Logout />
        },
        {
          path: 'account',
          element: <RequireAuth><Account /></RequireAuth>
        },
      ]
    }]
  },
  {
    path: '/admin',
    id: 'admin',
    element: <AdminLayout />,
    errorElement: <ErrorPage />,
    children: [{
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          element: <AdminHome />
        },
        {
          path: 'users',
          element: <Users />
        },
        {
          path: 'whitelist',
          element: <Whitelist />
        }
      ]
    }]
  }
]

export const router = createBrowserRouter(routes)
