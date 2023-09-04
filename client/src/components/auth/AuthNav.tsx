import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import Tooltip from '@mui/material/Tooltip'
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import IconButton from "@mui/material/IconButton"
import LoginIcon from '@mui/icons-material/Login'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import { green } from '@mui/material/colors'
import Box from "@mui/material/Box"

export default function AuthNav() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null)

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget)
  }

  const handleCloseUserMenu = () => {
    setAnchorElUser(null)
  }

  const handleLogout = () => {
    setAnchorElUser(null)
    navigate('/logout')
  }

  if (!auth.user) {
    return <Link to="/login" style={{ textDecoration: "none", color: "inherit" }}>
      <Button startIcon={<LoginIcon sx={{ mb: 0.3 }} />}
        sx={{ px: 3, color: "white", display: "flex", fontSize: '16px', fontWeight: '700' }}
        size='large'>
      </Button>
    </Link>
  }

  return (
    <Box sx={{ mr: .5, }}>
      {/*Welcome {auth.user.displayName || auth.user.email}!{" "}&nbsp;&nbsp;*/}
      <Tooltip title="click to logout">
        <IconButton onClick={handleOpenUserMenu} >
          <Avatar sx={{ bgcolor: green[600] }}>{auth.user.displayName.slice(0, 1).toUpperCase() || auth.user.email.slice(0, 1).toUpperCase()}</Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        sx={{ mt: "45px" }}
        id="menu-appbar"
        anchorEl={anchorElUser}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        keepMounted
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        open={Boolean(anchorElUser)}
        onClose={handleCloseUserMenu}
      >
        <MenuItem onClick={handleLogout}>
          <Typography textAlign="center">Logout</Typography>
        </MenuItem>
      </Menu>
    </Box>
  )
}
