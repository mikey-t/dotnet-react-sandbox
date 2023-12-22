import * as React from 'react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Menu from '@mui/material/Menu'
import MenuIcon from '@mui/icons-material/Menu'
import Container from '@mui/material/Container'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import MenuItem from '@mui/material/MenuItem'
import CameraIcon from '@mui/icons-material/Camera'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from './auth/AuthProvider'
import { PageNavInfo } from '../model/PageNavInfo'
import Link from '@mui/material/Link/Link'

// TODO:
// - Responsive version
// - Auth functionality

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
