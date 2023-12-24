import Link from '@mui/material/Link/Link'
import Typography from '@mui/material/Typography/Typography'

export default function AlreadyHaveAnAccount() {
  return (
    <Typography>
      Already have an account? <Link href="/login" component={Link}>Sign In</Link>
    </Typography>
  )
}
