import {Avatar, CssBaseline, Grid, TextField} from '@mui/material'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import Typography from '@mui/material/Typography'
import React, {useState} from 'react'
import Button from '@mui/material/Button'
import MuiLink from '@mui/material/Link'
import {Link, useNavigate} from 'react-router-dom'
import AccountApi from '../../logic/AccountApi'
import Alert from '@mui/material/Alert'

const api = new AccountApi()

export default function RegisterWithEmail() {
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
    <Container component="main" maxWidth="xs">
      <CssBaseline/>
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Alert severity="info">This site is in Alpha. You may not register or login unless you have received an invite.</Alert>
        
        <Typography sx={{my: 3}} variant="h4" gutterBottom={true}>
          Sign up
        </Typography>
        <Typography variant='body1' sx={{mb: 2, maxWidth:'400px', textAlign:'center'}}> *By signing up you agree to
          <MuiLink to="/terms" component={Link} style={{textDecoration: "none"}}> Terms,</MuiLink>
          <MuiLink to="/privacy" component={Link} style={{textDecoration: "none"}}> Privacy </MuiLink> and
          <MuiLink to="/content" component={Link} style={{textDecoration: "none"}}> Content Policy. </MuiLink>
        </Typography>
        <Box component="form" noValidate onSubmit={handleSubmit} sx={{mt: 3}}>
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
            {/*<Grid item xs={12}>*/}
            {/*  <FormControlLabel*/}
            {/*    control={<Checkbox value="allowExtraEmails" color="primary"/>}*/}
            {/*    label="I want to receive inspiration, marketing promotions and updates via email."*/}
            {/*  />*/}
            {/*</Grid>*/}
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{mt: 3, mb: 2}}
          >
            Sign Up
          </Button>
          <Grid container justifyContent="flex-end">
            <Grid item>
              <MuiLink to="/login" variant="body2" component={Link}>
                Already have an account? Sign in
              </MuiLink>
            </Grid>
          </Grid>
          <Grid container justifyContent="flex-end">
            <Grid item>
              <MuiLink to="/register-resend-email" variant="body2" component={Link}>
                Resend verification email
              </MuiLink>
            </Grid>
          </Grid>
        </Box>
      </Box>
      {message && <Box sx={{pt: '30px'}}>
        <Alert severity="error">{message}</Alert>
      </Box>}
    </Container>
  )
}
