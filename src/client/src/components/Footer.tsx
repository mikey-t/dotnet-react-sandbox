import * as React from 'react'
import Copyright from './Copyright'
import {Box} from '@mui/material'
import Button from '@mui/material/Button'
import {Link} from 'react-router-dom'

export default function Footer() {
  return (
    <footer>
      <Copyright/>
      <Box sx={{justifyContent: 'center', display: 'flex'}}>
        <Box>
          <Link to="privacy" style={{textDecoration: "none", color: "inherit"}}>
            <Button size='small' sx={{color: 'dimgrey', textTransform: 'none',}}>Privacy</Button>
          </Link>
          <Link to="/terms" style={{textDecoration: "none", color: "inherit"}}>
            <Button size='small' sx={{color: 'dimgrey', textTransform: 'none',}}>Terms</Button>
          </Link>
          <Link to="/content" style={{textDecoration: "none", color: "inherit"}}>
            <Button size='small' sx={{color: 'dimgrey', textTransform: 'none',}}>Content Policy</Button>
          </Link>

        </Box>

      </Box>
    </footer>
  )
}


