import Container from '@mui/material/Container'
import {Outlet} from 'react-router-dom'
import Footer from '../components/Footer'
import NavBar from '../components/NavBar'

export default function MainLayout() {
  return (
    <>
      <NavBar/>
      <Container sx={{minHeight: 'calc(100vh - 160px)'}} maxWidth="lg">
        <main>
          <Outlet/>
        </main>
      </Container>
      <Footer/>
    </>
  )
}
