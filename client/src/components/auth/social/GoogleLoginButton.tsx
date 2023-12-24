import { useEffect, useState } from 'react'
import { SiteSettings } from '../../../SiteSettings'
import { CredentialResponse } from 'google-one-tap'

interface GoogleLoginButtonProps {
  onInitFailure: (response: unknown) => void
  onLoginFailure: (response: unknown) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess: (response: any) => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onInitFailure, onLoginFailure, onSuccess }: GoogleLoginButtonProps) => {
  const [loading, setLoading] = useState<boolean>(true)

  const handleGoogleCredentialResponse = (response: CredentialResponse) => {
    // Unclear if this used to be a thing, but the typescript type has no error property and the initialize method has no error callback...
    // if (response.error) {
    //   onLoginFailure(response.error)
    //   return
    // }
    onSuccess(response)
  }

  useEffect(() => {
    let isCanceled = false

    try {
      google.accounts.id.initialize({
        client_id: SiteSettings.GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse
      })

      const loginButton = document.getElementById('login-with-google')
      if (!loginButton) {
        throw new Error('login-with-google element not found')
      }

      google.accounts.id.renderButton(
        loginButton,
        {
          theme: 'filled_blue',
          text: 'signin',
          width: 245,
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
