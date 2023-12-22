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
import { useNavigate } from 'react-router-dom'
import { useAuth } from './auth/AuthProvider'
import { PageNavInfo } from '../model/PageNavInfo'
import Link from '@mui/material/Link/Link'

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
        <Toolbar>
          <SiteName />
          <Box sx={{ pl: '1rem', flexGrow: 1 }}>
            {pages.map((page, idx) =>
            (<Link key={idx} href={page.location}>
              <Button>{page.title}</Button>
            </Link>)
            )}
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
