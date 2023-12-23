import Copyright from './Copyright'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box/Box'
import Link from '@mui/material/Link/Link'
import { LinkInfo } from '../model/LinkInfo'

const links: LinkInfo[] = [
  {
    title: 'Privacy',
    location: '/privacy'
  },
  {
    title: 'Terms',
    location: '/terms'
  },
  {
    title: 'Content Policy',
    location: '/content-policy'
  },
]

export default function Footer() {
  return (
    <Box component="footer" sx={{ py: 0.5, px: 2 }}>
      <Copyright />
      <Box sx={{ justifyContent: 'center', display: 'flex' }}>
        <Box>
          {links.map((link, idx) => (
            <Link key={idx} href={link.location}>
              <Button size='small' sx={{ color: 'dimgrey', textTransform: 'none' }}>{link.title}</Button>
            </Link>
          ))}&nbsp;
        </Box>
      </Box>
    </Box>
  )
}
