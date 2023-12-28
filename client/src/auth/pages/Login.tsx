import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link/Link'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SiteSettings } from '../../SiteSettings'
import Button1 from '../../components/Button1'
import LoadingBackdrop from '../../components/LoadingBackdrop'
import AccountApi from '../../logic/AccountApi'
import AlphaLoginDisclaimer from '../components/AlphaLoginDisclaimer'
import AuthPageTitle from '../components/AuthPageTitle'
import { useAuth } from '../components/AuthProvider'
import GoogleLoginButton from '../components/GoogleLoginButton'
import MicrosoftLoginButton from '../components/MicrosoftLoginButton'

const api = new AccountApi()

export default function Login() {
  const auth = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [hasError, setHasError] = useState<boolean>(false)
  const [externalLoginError, setExternalLoginError] = useState<string>('')
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleGoogleCredentialResponse = (credentialResponse: any) => {
    setLoading(true)
    api.loginGoogle(credentialResponse.credential).then(res => {
      if (res.isError()) {
        setLoading(false)
        if (res.statusCode === 401) {
          setWhitelistError(true)
          return
        }
        throw new Error('error logging in with google', res.exception?.toJson())
      }
      const user = res.data!
      auth.login(user, () => {
        navigate(fromUrl, { replace: true })
        return
      })
    }).catch(err => {
      setLoading(false)
      console.log('google login error', err)
      setExternalLoginError('An unexpected error occurred attempting to login with google')
    })
  }

  return (
    <>
      <LoadingBackdrop loading={loading} />
      <Grid container sx={{ marginTop: 2, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <AlphaLoginDisclaimer />
        <AuthPageTitle>Sign In</AuthPageTitle>
        {SiteSettings.ENABLE_EXTERNAL_LOGINS && <Grid item xs={12}>
          <Box>
            <GoogleLoginButton
              onSuccess={handleGoogleCredentialResponse}
              onLoginFailure={(error) => {
                console.error('error processing google login response', error)
                setExternalLoginError('An unexpected error occurred attempting to login with google')
              }}
              onInitFailure={(error) => {
                console.error('error initializing google login button', error)
              }}
            />
          </Box>
        </Grid>}
        {SiteSettings.ENABLE_EXTERNAL_LOGINS && <Grid item xs={12}>
          <MicrosoftLoginButton
            onWhitelistFailure={() => {
              setWhitelistError(true)
            }}
            onFailure={() => {
              setExternalLoginError('An unexpected error occurred attempting to login with microsoft')
            }}
            onSuccess={(user) => {
              auth.login(user, () => {
                navigate(fromUrl, { replace: true })
              })
            }}
          />
        </Grid>}
        {externalLoginError && <Alert severity="error">{externalLoginError}</Alert>}
        {SiteSettings.ENABLE_EXTERNAL_LOGINS && <Grid item xs={12}>
          <Typography variant="h5" gutterBottom={true} sx={{ mt: 2 }}>OR</Typography>
        </Grid>}
        <Grid item xs={12} sm={4}>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ maxWidth: '400px' }}>
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
            <Button1 type="submit" sx={{ mt: 2 }}>
              Login
            </Button1>
          </Box>
          {hasError && <Alert severity="error" sx={{ mt: '1rem' }}>Email or password is incorrect</Alert>}
          {whitelistError && <Alert severity="error" sx={{ mt: '1rem' }}>Your account has not received an invite</Alert>}
        </Grid>
        <Typography sx={{ pt: '1rem' }}>
          Don&apos;t have an account? <Link href="/sign-up-external">Sign up</Link>
        </Typography>
      </Grid>
    </>
  )
}
