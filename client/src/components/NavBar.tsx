import CameraIcon from '@mui/icons-material/Camera'
import MenuIcon from '@mui/icons-material/Menu'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton/IconButton'
import Link from '@mui/material/Link/Link'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { NavLink } from 'react-router-dom'
import { LinkInfo, User } from '../model/models'
import LinksMenu from './LinksMenu'
import { useAuth } from './auth/AuthProvider'
import NavBarAuth from './auth/NavBarAuth'

const publicPages: LinkInfo[] = [
  {
    title: 'Products',
    location: '/products'
  },
  {
    title: 'Pricing',
    location: '/pricing'
  },
  {
    title: 'Blog',
    location: '/blog'
  },
]

const protectedPages: LinkInfo[] = [
  {
    title: 'Account',
    location: '/account'
  },
]

export default function NavBar({ isSmallScreen }: { isSmallScreen: boolean }) {
  const { user } = useAuth()
  return isSmallScreen ? <NarrowNavBar user={user} /> : <WideNavBar user={user} />
}

const WideNavBar = ({ user }: { user: User | null }) => {
  const pages = user != null ? [...publicPages, ...protectedPages] : publicPages

  return (
    <AppBar position="static">
      <Container maxWidth="lg" disableGutters>
        <Toolbar component="nav">
          <SiteName />
          <Box sx={{ pl: '1rem', flexGrow: 1 }} id="nav-links">
            {
              pages.map((page, idx) => (
                <NavLink
                  key={idx}
                  to={page.location}
                  className={({ isActive, isPending }) =>
                    isPending ? "pending" : isActive ? "active" : ""
                  }
                >
                  {({ isActive }) => (
                    <Button
                      variant={isActive ? "outlined" : "text"}
                    >
                      {page.title}
                    </Button>
                  )}
                </NavLink>
              ))
            }
          </Box>
          <NavBarAuth />
        </Toolbar>
      </Container>
    </AppBar>
  )
}

const NarrowNavBar = ({ user }: { user: User | null }) => {
  const pages = user != null ? [...publicPages, ...protectedPages] : publicPages

  return (
    <AppBar position="static">
      <Toolbar>
        <SiteName />
        <Box sx={{ flexGrow: 1 }} />
        <NavBarAuth />
        <LinksMenu links={pages} anchorElement={<IconButton aria-label="menu"><MenuIcon /></IconButton>} />
      </Toolbar>
    </AppBar>
  )
}

const SiteName = () => {
  return (
    <Link id="site-title" href="/" sx={{ textDecoration: 'none' }}>
      <Typography variant="h6" color="primary" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
        <CameraIcon sx={{ mr: '6px' }} />
        Dotnet React Sandbox
      </Typography>
    </Link>
  )
}
