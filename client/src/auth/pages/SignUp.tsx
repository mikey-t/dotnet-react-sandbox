import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SiteSettings } from '../../SiteSettings'
import AlphaLoginDisclaimer from '../components/AlphaLoginDisclaimer'
import AlreadyHaveAnAccount from '../components/AlreadyHaveAnAccount'
import AuthPageTitle from '../components/AuthPageTitle'
import { useAuth } from '../components/AuthProvider'
import GoogleLoginButton from '../components/GoogleLoginButton'
import LegalDisclaimer from '../components/LegalDisclaimer'
import LinkButton from '../components/LinkButton'
import MicrosoftLoginButton from '../components/MicrosoftLoginButton'

export default function SignUp() {
  const auth = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()
  const [socialLoginError, setSocialLoginError] = useState<string>('')
  const [whitelistError, setWhitelistError] = useState<boolean>(false)

  const fromUrl = state?.from?.pathname || '/'

  return (
    <Grid container sx={{ marginTop: 2, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'left' }}>
      <AlphaLoginDisclaimer />
      <AuthPageTitle>Sign Up</AuthPageTitle>
      <LegalDisclaimer />
      {SiteSettings.ENABLE_SOCIAL_LOGINS && <Grid item xs={12}>
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
      </Grid>}
      {SiteSettings.ENABLE_SOCIAL_LOGINS && <Grid item xs={12}>
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
      <Grid item xs={12}>
        {whitelistError && <Alert severity="error" sx={{ mb: '2rem' }}>Your account has not received an invite</Alert>}
      </Grid>
      {SiteSettings.ENABLE_SOCIAL_LOGINS && <Grid item xs={12}>
        <Typography variant="h5" gutterBottom={true} sx={{ mt: 2 }}>OR
        </Typography>
      </Grid>}
      <Grid item xs={12}>
        <Box sx={{ maxWidth: '245px', mb: 2 }}>
          <LinkButton to="/register">Register with Email</LinkButton>
        </Box>
        <AlreadyHaveAnAccount />
      </Grid>
    </Grid>
  )
}
