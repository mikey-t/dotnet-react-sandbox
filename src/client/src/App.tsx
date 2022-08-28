import React from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import {BrowserRouter, Route, Routes} from 'react-router-dom'
import {createTheme, ThemeProvider} from '@mui/material/styles'
import Home from './pages/Home'
import MainLayout from './layout/MainLayout'
import NotFound from './pages/NotFound'
import Products from './pages/Products'
import Pricing from './pages/Pricing'
import Blog from './pages/Blog'
import Account from './pages/protected/Account'
import RequireAuth from './components/auth/RequireAuth'
import RequireNotAuth from './components/auth/RequireNotAuth'
import Login from './pages/auth/Login'
import SignUp from './pages/auth/SignUp'
import Register from './pages/auth/Register'
import VerifyEmail from './pages/auth/VerifyEmail'
import RegisterNext from './pages/auth/RegisterNext'
import RegisterResendEmail from './pages/auth/RegisterResendEmail'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import ContentPolicy from './pages/ContentPolicy'
import GoogleAnalytics from './components/GoogleAnalytics'
import {SnackbarProvider} from 'notistack'
import Logout from './pages/auth/Logout'
import {AuthProvider} from './components/auth/AuthProvider'
import AdminLayout from './layout/AdminLayout'
import AdminHome from './pages/admin/AdminHome'
import Users from './pages/admin/Users'
import Whitelist from './pages/admin/Whitelist'

const theme = createTheme({
  palette: {
    mode: 'dark'
  }
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      <BrowserRouter>
        <GoogleAnalytics>
          <SnackbarProvider maxSnack={3} anchorOrigin={{vertical: 'bottom', horizontal: 'left',}} autoHideDuration={1500}>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<MainLayout/>}>
                  <Route index element={<Home/>}/>
                  <Route path="/login" element={<RequireNotAuth><Login/></RequireNotAuth>}/>
                  <Route path="/sign-up" element={<RequireNotAuth><SignUp/></RequireNotAuth>}/>
                  <Route path="/register" element={<RequireNotAuth><Register/></RequireNotAuth>}/>
                  <Route path="/verify-email" element={<VerifyEmail/>}/>
                  <Route path="/register-next" element={<RequireNotAuth><RegisterNext/></RequireNotAuth>}/>
                  <Route path="/register-resend-email" element={<RequireNotAuth><RegisterResendEmail/></RequireNotAuth>}/>
                  <Route path="/privacy" element={<Privacy/>}/>
                  <Route path="/terms" element={<Terms/>}/>
                  <Route path="/content" element={<ContentPolicy/>}/>
                  <Route path="/products" element={<Products/>}/>
                  <Route path="/pricing" element={<Pricing/>}/>
                  <Route path="/blog" element={<Blog/>}/>
                  <Route path="/account" element={<RequireAuth><Account/></RequireAuth>}/>
                  <Route path="*" element={<NotFound/>}/>
                </Route>
                <Route path="/admin" element={<RequireAuth role="SUPER_ADMIN"><AdminLayout/></RequireAuth>}>
                  <Route index element={<AdminHome/>}/>
                  <Route path="/admin/users" element={<Users/>}/>
                  <Route path="/admin/whitelist" element={<Whitelist/>}/>
                  <Route path="*" element={<NotFound/>}/>
                </Route>
                <Route path="/logout" element={<Logout/>}/>
              </Routes>
            </AuthProvider>
          </SnackbarProvider>
        </GoogleAnalytics>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
