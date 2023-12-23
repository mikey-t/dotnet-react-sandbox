import Avatar from '@mui/material/Avatar/Avatar'
import Box from '@mui/material/Box/Box'
import Button from '@mui/material/Button/Button'
import IconButton from "@mui/material/IconButton/IconButton"
import Link from '@mui/material/Link/Link'
import { LinkInfo } from '../../model/LinkInfo'
import LinksMenu from '../LinksMenu'
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

export default function NavBarAuth() {
  const auth = useAuth()

  if (!auth.user) {
    return (
      <Link href="/login">
        <Button>Login</Button>
      </Link>
    )
  }

  return (
    <Box sx={{ mr: .5, }}>
      <LinksMenu links={links} anchorElement={
        <IconButton>
          <Avatar sx={{ bgcolor: 'secondary.main' }}>{auth.user.displayName.slice(0, 1).toUpperCase() || auth.user.email.slice(0, 1).toUpperCase()}</Avatar>
        </IconButton>
      } />
    </Box>
  )
}
