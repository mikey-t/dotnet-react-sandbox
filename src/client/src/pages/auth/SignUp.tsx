import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../components/auth/AuthProvider'
import React, { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import AccountApi from '../../logic/AccountApi'
import { Configuration, PublicClientApplication } from '@azure/msal-browser'
import MuiLink from '@mui/material/Link'
import LoadingBackdrop from '../../components/LoadingBackdrop'
import Container from '@mui/material/Container'
import Button1 from '../../components/Button1'

const api = new AccountApi()
const msalConfig: Configuration = {
  auth: {
    clientId: '81ad0388-4a7d-456b-ba24-e0cb05ab840e'
  }
}
const msalInstance = new PublicClientApplication(msalConfig)

export default function SignUp() {
  const auth = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation() as any
  const [socialLoginError, setSocialLoginError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)

  const from = state?.from?.pathname || '/'

  const handleGoogleCredentialResponse = (credentialResponse: any) => {
    api.loginGoogle(credentialResponse.credential).then(res => {
      if (res.isError()) {
        console.error('error logging in with google', res.exception?.toJson())
        navigate('/error')
        return
      }
      const user = res.data!
      auth.login(user, () => {
        navigate(from, { replace: true })
      })
    }).catch(err => {
      console.log('google login error', err)
      setSocialLoginError('An unexpected error occurred attempting to login with google')
    })
  }

  const msLogin = async () => {
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
        console.error('error processing microsoft login', authResponse.exception?.toJson())
        navigate('/error')
        return
      }
      const user = authResponse.data!
      auth.login(user, () => {
        navigate(from, { replace: true })
      })
    } catch (err) {
      console.log('error opening MS login popup', err)
    }
  }

  useEffect(() => {
    let isCanceled = false

    try {
      const google = (window as any).google

      google.accounts.id.initialize({
        client_id: '401991059899-77oajm3ee1ukke4sktd0q1e05v44sub3.apps.googleusercontent.com',
        callback: handleGoogleCredentialResponse
      })
      google.accounts.id.renderButton(
        document.getElementById("login-with-google"),
        {
          theme: "filled_blue",
          text: "Sign in with Google",
          width: '245px',
          logo_alignment: 'left'
        }
      )
    } catch (err) {
      console.error('error initializing google login button')
    } finally {
      if (!isCanceled) setLoading(false)
    }

    return () => {
      isCanceled = true
    }
  }, [])

  return (
    <>
      <LoadingBackdrop loading={loading} />

      <Grid container sx={{ marginTop: 5, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'left' }}>
        <Box>
          <Alert severity="info">This site is in Alpha. You may not register or login unless you have received an
            invite.</Alert>
        </Box>
        <Box>
          <Typography sx={{ my: 3 }} variant="h4" gutterBottom={true}>
            Sign Up
          </Typography>
        </Box>
        <Typography variant='body1' sx={{ mb: 2, maxWidth: '400px', textAlign: 'center' }}> *By signing up you agree to
          <MuiLink to="/terms" component={Link} style={{ textDecoration: "none" }}> Terms,</MuiLink>
          <MuiLink to="/privacy" component={Link} style={{ textDecoration: "none" }}> Privacy </MuiLink> and
          <MuiLink to="/content" component={Link} style={{ textDecoration: "none" }}> Content Policy. </MuiLink>
        </Typography>

        <Grid item xs={12}>
          <Box sx={{ width: '250px' }}>
            <Box id="login-with-google"></Box>
            {socialLoginError && <Alert severity="error">{socialLoginError}</Alert>}
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Box
            component="img"
            sx={{
              width: '244px',
              pt: 1,
              cursor: 'pointer'
            }}
            src='/images/ms-login.svg'
            alt='ms-login'
            onClick={msLogin}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom={true} sx={{ mt: 2 }}>OR
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ maxWidth: '245px', mb: 2 }}>
            <Button1 onClick={_ => navigate(`/register`)}>Register with Email</Button1>
          </Box>
          <Typography>
            Already have an account? <MuiLink to="/login" component={Link} style={{ textDecoration: "none" }}>Login</MuiLink>
          </Typography>
        </Grid>
      </Grid>
    </>
  )
}
