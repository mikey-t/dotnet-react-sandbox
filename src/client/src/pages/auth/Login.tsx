import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../components/auth/AuthProvider'
import { useState } from 'react'
import Alert from '@mui/material/Alert'
import AccountApi from '../../logic/AccountApi'
import { Configuration, PublicClientApplication } from '@azure/msal-browser'
import MuiLink from '@mui/material/Link'
import Button1 from '../../components/Button1'
import { SETTINGS } from '../../settings'

const api = new AccountApi()
const msalConfig: Configuration = {
  auth: {
    clientId: SETTINGS.MICROSOFT_CLIENT_ID
  }
}
const msalInstance = new PublicClientApplication(msalConfig)

export default function Login() {
  const auth = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation() as any
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [hasError, setHasError] = useState<boolean>(false)
  const [socialLoginError, setSocialLoginError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [whitelistError, setWhitelistError] = useState<boolean>(false)

  const from = state?.from?.pathname || '/'

  const handleSubmit = async (event: any) => {
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
      console.log(user)
      auth.login(user, () => {
        navigate(from, { replace: true })
      })
    } catch (err) {
      console.error(err)
      setHasError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleCredentialResponse = (credentialResponse: any) => {
    setLoading(true)
    api.loginGoogle(credentialResponse.credential).then(res => {
      if (res.isError()) {
        setLoading(false)
        if (res.statusCode === 401) {
          setWhitelistError(true)
          return
        }
        console.error('error logging in with google', res.exception?.toJson())
        navigate('/error')
        return
      }
      const user = res.data!
      auth.login(user, () => {
        navigate(from, { replace: true })
        return
      })
    }).catch(err => {
      setLoading(false)
      console.log('google login error', err)
      setSocialLoginError('An unexpected error occurred attempting to login with google')
    })
  }

  const msLogin = async () => {
    if (loading) return
    setLoading(true)
    console.log('attempting to open MS login popup')
    const loginRequest = {
      scopes: ['email', 'profile'],
      prompt: 'select_account',
      responseMode: 'fragment', // This is the only supported mode: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/FAQ.md#why-is-fragment-the-only-valid-field-for-responsemode-in-msal-browser
      redirectUri: '/api/account/microsoft-login-redirect' // Required here in addition to being setup in azure portal
    }
    try {
      const result = await msalInstance.loginPopup(loginRequest)
      if (!result || !result.idToken) {
        setSocialLoginError('An unexpected error occurred attempting to login with google')
        return
      }
      const authResponse = await api.loginMicrosoft(result.idToken)
      if (authResponse.isError()) {
        setLoading(false)
        if (authResponse.statusCode === 401) {
          setWhitelistError(true)
          return
        }
        console.error('error processing microsoft login', authResponse.exception?.toJson())
        navigate('/error')
        return
      }
      const user = authResponse.data!
      auth.login(user, () => {
        navigate(from, { replace: true })
        return
      })
    } catch (err) {
      console.log('error opening MS login popup', err)
      setLoading(false)
    }
  }

  // useEffect(() => {
  //   let isCanceled = false
  //
  //   try {
  //     const google = (window as any).google
  //
  //     google.accounts.id.initialize({
  //       client_id: SETTINGS.GOOGLE_CLIENT_ID,
  //       callback: handleGoogleCredentialResponse
  //     })
  //     google.accounts.id.renderButton(
  //       document.getElementById("login-with-google"),
  //       {
  //         theme: "filled_blue",
  //         text: "Sign in with Google",
  //         width: '245px',
  //         logo_alignment: 'left'
  //       }
  //     )
  //   } catch (err) {
  //     console.error('error initializing google login button')
  //   } finally {
  //     if (!isCanceled) setLoading(false)
  //   }
  //
  //   return () => {
  //     isCanceled = true
  //   }
  // }, [])

  return (
    <>
      {/*<LoadingBackdrop loading={loading}/>*/}


      <Grid container sx={{ marginTop: 5, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>


        <Box>
          <Alert severity="info">This site is in Alpha. You may not register or login unless you have received an invite.</Alert>
        </Box>
        <Box>
          <Typography sx={{ my: 3 }} variant="h4" gutterBottom={true}>
            Login
          </Typography>
        </Box>

        {/*<Grid item xs={12}>*/}
        {/*  <Box>*/}
        {/*    <Box sx={{width: '250px'}} id="login-with-google"></Box>*/}
        {/*    {socialLoginError && <Alert severity="error">{socialLoginError}</Alert>}*/}
        {/*  </Box>*/}
        {/*</Grid>*/}
        {/*<Grid item xs={12}>*/}
        {/*  <Box*/}
        {/*    component="img"*/}
        {/*    sx={{*/}
        {/*      width: '244px',*/}
        {/*      pt: 1,*/}
        {/*      cursor: 'pointer'*/}
        {/*    }}*/}
        {/*    src='/images/ms-login.svg'*/}
        {/*    alt='ms-login'*/}
        {/*    onClick={msLogin}*/}
        {/*  />*/}
        {/*</Grid>*/}
        {/*<Grid item xs={12}>*/}
        {/*  <Typography variant="h5" gutterBottom={true} sx={{mt: 2}}>OR*/}
        {/*  </Typography>*/}
        {/*</Grid>*/}
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
          Don't have an account? <MuiLink to="/sign-up" component={Link} style={{ textDecoration: "none" }}> Sign up</MuiLink>
        </Typography>

      </Grid>


    </>
  )
}
