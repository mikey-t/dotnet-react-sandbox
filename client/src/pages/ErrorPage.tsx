import Box from '@mui/material/Box/Box'
import Container from '@mui/material/Container/Container'
import Link from '@mui/material/Link/Link'
import Paper from '@mui/material/Paper/Paper'
import Typography from '@mui/material/Typography/Typography'
import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import Footer from '../components/Footer'

export default function ErrorPage() {
  const error = useRouteError()
  console.error(error)
  let errorMessage: string | null = null
  let isNotFound = false

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      isNotFound = true
    }
    errorMessage = `${error.status}: ${error.statusText}`
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Container maxWidth="sm">
          <Paper elevation={3} sx={{ padding: 3, marginTop: 5, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>
              {isNotFound ? 'Not Found!' : 'Oops! An error occurred...'}
            </Typography>
            <Box>
              <Link href="/">Go Home</Link>
            </Box>
            {errorMessage && <Paper elevation={6} sx={{ width: '100%', textAlign: 'left', backgroundColor: 'black', py: '10px', px: '25px', mt: '20px' }}>
              <Typography color="text.secondary">
                {errorMessage}
              </Typography>
            </Paper>}
            {isNotFound && <Box
              component="img"
              sx={{
                maxWidth: 370,
                maxHeight: 370,
                marginTop: 2
              }}
              alt="Error"
              src="/images/404QR.png"
            />}
          </Paper>
        </Container>
      </Box>
      <Footer />
    </Box>

  )
}
