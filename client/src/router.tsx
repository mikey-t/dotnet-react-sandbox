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
import Login from './auth/pages/Login'
import Logout from './auth/pages/Logout'
import Account from './pages/protected/Account'
import RequireAuth from './auth/components/RequireAuth'
import RequireNotAuth from './auth/components/RequireNotAuth'
import SignUpExternal from './auth/pages/SignUpExternal'
import SignUpEmail from './auth/pages/SignUpEmail'
import VerifyEmail from './auth/pages/VerifyEmail'
import SignUpNext from './auth/pages/SignUpNext'
import SignUpResendEmail from './auth/pages/SignUpResendEmail'
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
          path: 'sign-up-external',
          element: <RequireNotAuth><SignUpExternal /></RequireNotAuth>
        },
        {
          path: 'sign-up-email',
          element: <RequireNotAuth><SignUpEmail /></RequireNotAuth>
        },
        {
          path: 'verify-email',
          element: <RequireNotAuth><VerifyEmail /></RequireNotAuth>
        },
        {
          path: 'sign-up-next',
          element: <RequireNotAuth><SignUpNext /></RequireNotAuth>
        },
        {
          path: 'sign-up-resend-email',
          element: <RequireNotAuth><SignUpResendEmail /></RequireNotAuth>
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
