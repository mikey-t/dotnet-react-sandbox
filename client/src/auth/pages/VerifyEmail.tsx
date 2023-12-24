import Container from '@mui/material/Container/Container'
import Link from '@mui/material/Link/Link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
    <Container maxWidth="sm">
      {!message && <p>Processing...</p>}
      {message && <div>
        <p>{message}</p>
        <p><Link href="/login">Click here to go to the login page</Link></p>
      </div>}
    </Container>
  )
}
