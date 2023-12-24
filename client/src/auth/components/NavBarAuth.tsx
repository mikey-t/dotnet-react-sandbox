import Avatar from '@mui/material/Avatar/Avatar'
import Box from '@mui/material/Box/Box'
import Button from '@mui/material/Button/Button'
import IconButton from "@mui/material/IconButton/IconButton"
import Link from '@mui/material/Link/Link'
import { LinkInfo } from '../../model/models'
import LinksMenu from '../../components/LinksMenu'
import { useAuth } from './AuthProvider'

const links: LinkInfo[] = [
  {
    title: 'Account',
    location: '/account'
  },
  {
    title: 'Logout',
    location: '/logout'
  }
]

const adminLinks: LinkInfo[] = [
  {
    title: 'Admin',
    location: '/admin'
  }
]

export default function NavBarAuth() {
  const { user } = useAuth()

  if (!user) {
    return (
      <Link href="/login">
        <Button>Login</Button>
      </Link>
    )
  }

  const allLinks = user.isSuperAdmin ? [...adminLinks, ...links] : [...links]

  return (
    <Box sx={{ mr: .5, }}>
      <LinksMenu links={allLinks} anchorElement={
        <IconButton>
          <Avatar sx={{ bgcolor: 'secondary.light' }}>{user.displayName.slice(0, 1).toUpperCase() || user.email.slice(0, 1).toUpperCase()}</Avatar>
        </IconButton>
      } />
    </Box>
  )
}
