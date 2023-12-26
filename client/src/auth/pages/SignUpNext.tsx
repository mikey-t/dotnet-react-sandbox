import Container from '@mui/material/Container/Container'
import Link from '@mui/material/Link/Link'
import AuthPageTitle from '../components/AuthPageTitle'

export default function SignUpNext() {
  return (
    <Container maxWidth="sm">
      <AuthPageTitle>Sign Up - Next Steps</AuthPageTitle>
      <p>
        You must verify your email before logging in.
        You should receive an email with a verification link.
        Follow the link to complete your registration.
      </p>
      <p>
        Be sure to check your spam folder if you do not see the email in your inbox within a few minutes.
        If you do not receive an email within one hour, please <Link href="/sign-up-resend-email">click here</Link>.
      </p>
    </Container>
  )
}
