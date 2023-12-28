/* eslint-disable @typescript-eslint/no-explicit-any */
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { SiteSettings } from '../../SiteSettings'
import AccountApi from '../../logic/AccountApi'
import AlphaLoginDisclaimer from '../components/AlphaLoginDisclaimer'
import AlreadyHaveAnAccount from '../components/AlreadyHaveAnAccount'
import AuthPageTitle from '../components/AuthPageTitle'
import { useAuth } from '../components/AuthProvider'
import GoogleLoginButton from '../components/GoogleLoginButton'
import LegalDisclaimer from '../components/LegalDisclaimer'
import LinkButton from '../components/LinkButton'
import MicrosoftLoginButton from '../components/MicrosoftLoginButton'

const api = new AccountApi()

export default function SignUpExternal() {
  if (!SiteSettings.ENABLE_EXTERNAL_LOGINS) {
    return <Navigate to="/sign-up-email" replace={true} />
  }

  const [loading, setLoading] = useState<boolean>(false)

  const auth = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()
  const [externalLoginError, setExternalLoginError] = useState<string>('')
  const [whitelistError, setWhitelistError] = useState<boolean>(false)

  const fromUrl = state?.from?.pathname || '/'

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
    <Grid container sx={{ marginTop: 2, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'left' }}>
      <AlphaLoginDisclaimer />
      <AuthPageTitle>Sign Up</AuthPageTitle>
      <LegalDisclaimer />
      {SiteSettings.ENABLE_EXTERNAL_LOGINS && <Grid item xs={12}>
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
        {externalLoginError && <Alert severity="error">{externalLoginError}</Alert>}
      </Grid>}
      {SiteSettings.ENABLE_EXTERNAL_LOGINS && <Grid item xs={12}>
        <MicrosoftLoginButton
          isParentPageLoading={loading}
          setLoading={setLoading}
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
      <Grid item xs={12}>
        {whitelistError && <Alert severity="error" sx={{ mb: '2rem' }}>Your account has not received an invite</Alert>}
      </Grid>
      {SiteSettings.ENABLE_EXTERNAL_LOGINS && <Grid item xs={12}>
        <Typography variant="h5" component="p" sx={{ mt: 2 }}>OR</Typography>
      </Grid>}
      <Grid item xs={12}>
        <Box sx={{ maxWidth: '245px', mb: 2 }}>
          <LinkButton to="/sign-up-email">Sign Up with Email</LinkButton>
        </Box>
        <AlreadyHaveAnAccount />
      </Grid>
    </Grid>
  )
}
