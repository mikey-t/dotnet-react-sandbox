import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import React, { useState } from 'react'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import AccountApi from '../../logic/AccountApi'
import AuthPageTitle from '../components/AuthPageTitle'
import Link from '@mui/material/Link/Link'

const api = new AccountApi()

export default function SignUpResendEmail() {
  const [email, setEmail] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage('')

    const res = await api.resendVerificationEmail(email)
    if (res.isError()) {
      if (res.statusCode === 400 && res.exception?.errors['Email'][0]) {
        setErrorMessage(res.exception.errors['Email'][0])
      } else {
        console.error('unexpected error', res.exception?.toJson())
        setErrorMessage('unexpected error')
      }
      return
    }

    setMessage('The verification email has been re-sent.')
  }

  return (
    <Container maxWidth="sm">
      <AuthPageTitle>Sign Up - Resend Verification Email</AuthPageTitle>
      {!message && <>
        <Box>
          <Typography>To have your registration email re-sent, please provide your email below.</Typography>
        </Box>
        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
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
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}>Submit</Button>
        </Box>
      </>}
      {errorMessage && <Box sx={{ pt: '10px' }}><Alert severity="error">{errorMessage}</Alert></Box>}
      {message && <Box sx={{ pt: '30px' }}>
        {message} <Link href="/login">Click here to go to the login page.</Link>
      </Box>}
    </Container>
  )
}
