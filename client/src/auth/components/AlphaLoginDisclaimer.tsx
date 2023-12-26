import Alert from '@mui/material/Alert/Alert'
import { SiteSettings } from '../../SiteSettings'
import Box from '@mui/material/Box/Box'
import Typography from '@mui/material/Typography/Typography'

export default function AlphaLoginDisclaimer() {
  if (!SiteSettings.ENABLE_ALPHA_LOGIN_DISCLAIMER) {
    return null
  }
  return (
    <Box>
      <Alert severity="info"><Typography variant="body2" align="center">This site is in Alpha. You may not sign up or login unless you have received an invite.</Typography></Alert>
    </Box>
  )
}
