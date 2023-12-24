import Box from '@mui/material/Box/Box'
import Link from '@mui/material/Link/Link'
import Typography from '@mui/material/Typography/Typography'

export default function LegalDisclaimer() {
  return (
    <Box sx={{mb: 1}}>
      <Typography variant='body1' sx={{ mb: 2, textAlign: 'center' }}> * By signing up you agree to
        <Link href="/terms" component={Link} style={{ textDecoration: "none" }}> Terms,</Link>
        <Link href="/privacy" component={Link} style={{ textDecoration: "none" }}> Privacy </Link> and
        <Link href="/content" component={Link} style={{ textDecoration: "none" }}> Content Policy. </Link>
      </Typography>
    </Box>
  )
}
