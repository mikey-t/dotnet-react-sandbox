import CameraIcon from '@mui/icons-material/Camera'
import MenuIcon from '@mui/icons-material/Menu'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton/IconButton'
import Link from '@mui/material/Link/Link'
import Menu from '@mui/material/Menu/Menu'
import MenuItem from '@mui/material/MenuItem/MenuItem'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import useTheme from '@mui/material/styles/useTheme'
import useMediaQuery from '@mui/material/useMediaQuery/useMediaQuery'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { PageNavInfo } from '../model/PageNavInfo'

const pages: PageNavInfo[] = [
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
  }
]

export default function NavBar() {
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))
  return isSmallScreen ? <NarrowNavBar /> : <WideNavBar />
}

const WideNavBar = () => {
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
          <Button>Login</Button>
        </Toolbar>
      </Container>
    </AppBar>
  )
}

const NarrowNavBar = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <SiteName />
        <Box sx={{ flexGrow: 1 }} />
        <IconButton
          aria-label="menu"
          onClick={handleOpen}
        >
          <MenuIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          {pages.map((page, idx) => (
            <MenuItem key={idx} onClick={handleClose}>
              <NavLink to={page.location} style={{ textDecoration: 'none', color: 'inherit' }}>
                {page.title}
              </NavLink>
            </MenuItem>
          ))}
        </Menu>
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
