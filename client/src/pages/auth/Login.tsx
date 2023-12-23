import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../components/auth/AuthProvider'
import { useState } from 'react'
import Alert from '@mui/material/Alert'
import AccountApi from '../../logic/AccountApi'
import MuiLink from '@mui/material/Link'
import Button1 from '../../components/Button1'
import GoogleLoginButton from '../../components/auth/social/GoogleLoginButton'
import MicrosoftLoginButton from '../../components/auth/social/MicrosoftLoginButton'
import LoadingBackdrop from '../../components/LoadingBackdrop'
import { SETTINGS } from '../../settings'

const api = new AccountApi()

export default function Login() {
  const auth = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [hasError, setHasError] = useState<boolean>(false)
  const [socialLoginError, setSocialLoginError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [whitelistError, setWhitelistError] = useState<boolean>(false)

  const fromUrl = state?.from?.pathname || '/'

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    if (loading) return
    setLoading(true)
    event.preventDefault()
    try {
      const userResponse = await api.login({ email, password })
      if (userResponse.isError()) {
        if (userResponse.statusCode === 401) {
          setHasError(true)
          return
        }
        console.error('login error', userResponse.exception?.toJson())
        setHasError(true)
        return
      }
      const user = userResponse.data!
      auth.login(user, () => {
        navigate(fromUrl, { replace: true })
      })
    } catch (err) {
      console.error(err)
      setHasError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <LoadingBackdrop loading={loading} />
      <Grid container sx={{ marginTop: 5, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Box>
          <Alert severity="info">This site is in Alpha. You may not register or login unless you have received an invite.</Alert>
        </Box>
        <Box>
          <Typography sx={{ my: 3 }} variant="h4" gutterBottom={true}>
            Login
          </Typography>
        </Box>
        {SETTINGS.ENABLE_SOCIAL_LOGINS && <Grid item xs={12}>
          <Box>
            <GoogleLoginButton
              onSuccess={(user) => {
                auth.login(user, () => {
                  navigate(fromUrl, { replace: true })
                })
              }}
              onLoginFailure={(error) => {
                console.error('error processing google login response', error)
                setSocialLoginError('An unexpected error occurred attempting to login with google')
              }}
              onInitFailure={(error) => {
                console.error('error initializing google login button', error)
              }}
            />
            {socialLoginError && <Alert severity="error">{socialLoginError}</Alert>}
          </Box>
        </Grid>}
        {SETTINGS.ENABLE_SOCIAL_LOGINS && <Grid item xs={12}>
          <MicrosoftLoginButton
            onWhitelistFailure={() => {
              setWhitelistError(true)
            }}
            onFailure={() => {
              setSocialLoginError('An unexpected error occurred attempting to login with microsoft')
            }}
            onSuccess={(user) => {
              auth.login(user, () => {
                navigate(fromUrl, { replace: true })
              })
            }}
          />
        </Grid>}
        {SETTINGS.ENABLE_SOCIAL_LOGINS && <Grid item xs={12}>
          <Typography variant="h5" gutterBottom={true} sx={{ mt: 2 }}>OR
          </Typography>
        </Grid>}
        <Grid item xs={12} sm={4}>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ maxWidth: '250px' }}>
            <TextField
              size="small"
              margin="dense"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={e => {
                setHasError(false)
                setEmail(e.target.value)
                setWhitelistError(false)
              }}
              error={hasError}
            />
            <TextField
              size="small"
              margin="dense"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={e => {
                setHasError(false)
                setPassword(e.target.value)
                setWhitelistError(false)
              }}
              error={hasError}
            />
            <Button1 type="submit" sx={{ my: 2 }}>
              Login
            </Button1>
            {hasError && <Alert severity="error" sx={{ mb: '2rem', mt: '2rem' }}>Email or password is incorrect</Alert>}
            {whitelistError && <Alert severity="error" sx={{ mb: '2rem' }}>Your account has not received an invite</Alert>}
          </Box>
        </Grid>
        <Typography>
          Don&apos;t have an account? <MuiLink to="/sign-up" component={Link} style={{ textDecoration: "none" }}> Sign up</MuiLink>
        </Typography>
      </Grid>
    </>
  )
}
