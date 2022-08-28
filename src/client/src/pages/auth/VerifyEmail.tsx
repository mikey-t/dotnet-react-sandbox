import Container from '@mui/material/Container'
import {useSearchParams} from 'react-router-dom'
import {useEffect, useState} from 'react'
import MuiLink from '@mui/material/Link'
import {Link} from 'react-router-dom'
import AccountApi from '../../logic/AccountApi'

const api = new AccountApi()

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [message, setMessage] = useState<string>('')
  
  useEffect(() => {
    const code = searchParams.get('code') || ''
    api.verifyEmail(code).then(res => {
      if (res.isError()) {
        setMessage('an unexpected error occurred')
        return
      }
      
      setMessage('Your email was successfully validated')
    })
  }, [searchParams])

  return (
    <Container>
      {!message && <p>Processing...</p>}
      {message && <>
        <p>{message}</p>
        <p><MuiLink to="/login" component={Link}>Click here to go to the login page</MuiLink></p>
      </>}
    </Container>
  )
}
