import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid/Grid'
import Link from '@mui/material/Link/Link'
import TextField from '@mui/material/TextField/TextField'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AlphaLoginDisclaimer from '../components/AlphaLoginDisclaimer'
import AlreadyHaveAnAccount from '../components/AlreadyHaveAnAccount'
import AuthPageTitle from '../components/AuthPageTitle'
import LegalDisclaimer from '../components/LegalDisclaimer'
import AccountApi from '../../logic/AccountApi'

const api = new AccountApi()

export default function RegisterWithEmail() {
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
    const res = await api.register(firstName, lastName, email, password)
    if (res.isError()) {
      setMessage('an unexpected error occurred')
      return
    }
    navigate('/register-next')
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
        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
          Sign Up
        </Button>
        {message && <Box sx={{ pb: '1rem', maxWidth: formWidth }}>
          <Alert severity="error">{message}</Alert>
        </Box>}
        <Box display="flex" flexDirection="column" alignItems="center">
          <AlreadyHaveAnAccount />
          <Link href="/register-resend-email">Resend verification email</Link>
        </Box>
      </Box>
    </Box>
  )
}
