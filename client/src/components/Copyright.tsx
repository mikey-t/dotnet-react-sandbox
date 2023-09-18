import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'

export default function Copyright() {
  return (
    <Box sx={{ pt: '1rem' }}>
      <Typography variant="body2" color="text.secondary" align="center">
        {'Copyright © '}
        <Link color="inherit" href="https://mikeyt.net" target="_blank">
          Mike Thompson
        </Link>{' '}
        {new Date().getFullYear()}
      </Typography>
    </Box>
  )
}
