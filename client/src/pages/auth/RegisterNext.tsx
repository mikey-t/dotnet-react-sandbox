import Container from '@mui/material/Container'
import MuiLink from '@mui/material/Link'
import { Link } from 'react-router-dom'

export default function RegisterNext() {
  return (
    <Container component="main" sx={{ pt: '30px' }}>
      <p>You must verify your email before logging in. You should receive an email with a verification link. Follow the link to complete your registration.</p>
      <p>Be sure to check your spam folder if you do not see the email in your inbox within a few minutes. If you do not receive an email within one hour, please <MuiLink to="/register-resend-email" component={Link}>click here</MuiLink>.</p>
    </Container>
  )
}
