import { useEffect, useState } from 'react'
import { SETTINGS } from '../../../settings'

interface GoogleLoginButtonProps {
  onInitFailure: (response: any) => void
  onLoginFailure: (response: any) => void
  onSuccess: (response: any) => void
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onInitFailure, onLoginFailure, onSuccess }) => {
  const [loading, setLoading] = useState<boolean>(true)

  const handleGoogleCredentialResponse = (response: any) => {
    if (response.error) {
      onLoginFailure(response.error)
      return
    }
    onSuccess(response)
  }

  useEffect(() => {
    let isCanceled = false

    try {
      const google = (window as any).google

      google.accounts.id.initialize({
        client_id: SETTINGS.GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse
      })
      google.accounts.id.renderButton(
        document.getElementById("login-with-google"),
        {
          theme: "filled_blue",
          text: "Sign in with Google",
          width: '245px',
          logo_alignment: 'left'
        }
      )
    } catch (err) {
      console.error('error initializing google login button', err)
      onInitFailure(err)
    } finally {
      if (!isCanceled) setLoading(false)
    }

    return () => {
      isCanceled = true
    }
  }, [])

  return (
    <>
      {loading && <div>Loading google button...</div>}
      <div id="login-with-google"></div>
    </>
  )
}

export default GoogleLoginButton