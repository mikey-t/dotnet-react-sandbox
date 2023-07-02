import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import MuiLink from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button1 from '../../components/Button1'
import LoadingBackdrop from '../../components/LoadingBackdrop'
import { useAuth } from '../../components/auth/AuthProvider'
import GoogleLoginButton from '../../components/auth/social/GoogleLoginButton'
import MicrosoftLoginButton from '../../components/auth/social/MicrosoftLoginButton'

export default function SignUp() {
  const auth = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation() as any
  const [socialLoginError, setSocialLoginError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [whitelistError, setWhitelistError] = useState<boolean>(false)

  const fromUrl = state?.from?.pathname || '/'

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
        </Grid>
        <Grid item xs={12}>
          <MicrosoftLoginButton
            onWhitelistFailure={() => {
              setWhitelistError(true)
            }}
            onFailure={(err) => {
              setSocialLoginError('An unexpected error occurred attempting to login with microsoft')
            }}
            onSuccess={(user) => {
              auth.login(user, () => {
                navigate(fromUrl, { replace: true })
              })
            }}
          />
        </Grid>
        <Grid item xs={12}>
          {whitelistError && <Alert severity="error" sx={{ mb: '2rem' }}>Your account has not received an invite</Alert>}
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
