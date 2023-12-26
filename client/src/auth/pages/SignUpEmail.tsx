import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid/Grid'
import Link from '@mui/material/Link/Link'
import TextField from '@mui/material/TextField/TextField'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button1 from '../../components/Button1'
import AccountApi from '../../logic/AccountApi'
import AlphaLoginDisclaimer from '../components/AlphaLoginDisclaimer'
import AlreadyHaveAnAccount from '../components/AlreadyHaveAnAccount'
import AuthPageTitle from '../components/AuthPageTitle'
import LegalDisclaimer from '../components/LegalDisclaimer'
import Typography from '@mui/material/Typography/Typography'
import { SiteSettings } from '../../SiteSettings'

const api = new AccountApi()

export default function SignUpEmail() {
  const formWidth = '400px'

  const [firstName, setFirstName] = useState<string>('')
  const [lastName, setLastName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [message, setMessage] = useState<string>('')

  const navigate = useNavigate()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    const res = await api.signUp(firstName, lastName, email, password)
    if (res.isError()) {
      if (res.statusCode === 400) {
        setMessage('an unexpected error occurred')
      }
      setMessage('an unexpected error occurred')
      return
    }
    navigate('/sign-up-next')
  }

  return (
    <Box sx={{ marginTop: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', }}>
      <AlphaLoginDisclaimer />
      <AuthPageTitle>Sign Up</AuthPageTitle>
      <LegalDisclaimer />
      <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1, maxWidth: formWidth }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              autoComplete="given-name"
              name="firstName"
              required
              fullWidth
              id="firstName"
              label="First Name"
              autoFocus
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              required
              fullWidth
              id="lastName"
              label="Last Name"
              name="lastName"
              autoComplete="family-name"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
            />
          </Grid>
        </Grid>
        <Button1 type="submit" sx={{ mt: 3, mb: 2 }}>
          Sign Up
        </Button1>
        {message && <Box sx={{ pb: '1rem', maxWidth: formWidth }}>
          <Alert severity="error">{message}</Alert>
        </Box>}
        {SiteSettings.ENABLE_EXTERNAL_LOGINS && <Box sx={{ textAlign: 'center' }}>
          Or, go back to <Link href="/sign-up-external">external account registration</Link>
        </Box>}
        <Box sx={{ textAlign: 'center' }}>
          <AlreadyHaveAnAccount />
          <Link href="/sign-up-resend-email">Resend verification email</Link>
        </Box>
      </Box>
    </Box>
  )
}
