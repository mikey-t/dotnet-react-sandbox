import { useMediaQuery } from '@mui/material'
import Box from '@mui/material/Box/Box'
import Container from '@mui/material/Container/Container'
import useTheme from '@mui/material/styles/useTheme'
import { Outlet } from 'react-router-dom'
import Footer from '../components/Footer'
import NavBar from '../components/NavBar'

export default function MainLayout() {
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavBar isSmallScreen={isSmallScreen} />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
      <Footer />
    </Box>
  )
}
