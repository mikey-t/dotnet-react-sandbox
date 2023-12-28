import { PublicClientApplication } from '@azure/msal-browser/dist/app/PublicClientApplication'
import { Configuration } from '@azure/msal-browser/dist/config/Configuration'
import Box from '@mui/material/Box'
import React, { useState } from 'react'
import { SiteSettings } from '../../SiteSettings'
import LoadingBackdrop from '../../components/LoadingBackdrop'
import AccountApi from '../../logic/AccountApi'
import { User } from '../../model/models'

const api = new AccountApi()
const msalConfig: Configuration = {
  auth: {
    clientId: SiteSettings.MICROSOFT_CLIENT_ID
  }
}
const msalInstance = new PublicClientApplication(msalConfig)

interface MicrosoftLoginButtonProps {
  onFailure: (errorMessage: string) => void
  onWhitelistFailure: () => void
  onSuccess: (user: User) => void
}

const MicrosoftLoginButton: React.FC<MicrosoftLoginButtonProps> = ({ onFailure, onWhitelistFailure, onSuccess }) => {
  const [loading, setLoading] = useState<boolean>(false)

  const msLogin = async () => {
    if (loading) return
    setLoading(true)
    const loginRequest = {
      scopes: ['email', 'profile'],
      prompt: 'select_account',
      responseMode: 'fragment', // This is the only supported mode: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/FAQ.md#why-is-fragment-the-only-valid-field-for-responsemode-in-msal-browser
      redirectUri: '/api/account/microsoft-login-redirect' // Required here in addition to being setup in azure portal
    }
    try {
      const result = await msalInstance.loginPopup(loginRequest)
      if (!result || !result.idToken) {
        onFailure('An unexpected error occurred attempting to login with microsoft')
        return
      }
      const authResponse = await api.loginMicrosoft(result.idToken)
      if (authResponse.isError()) {
        setLoading(false)
        if (authResponse.statusCode === 401) {
          onWhitelistFailure()
          return
        }
        console.error('error processing microsoft login', authResponse.exception?.toJson())
        onFailure('An unexpected error occurred attempting to login with microsoft')
        return
      }
      const user = authResponse.data!
      onSuccess(user)
      return
    } catch (err) {
      console.log('error opening MS login popup', err)
      setLoading(false)
    }
  }

  return (
    <>
      <LoadingBackdrop loading={loading} />
      <Box
        component="img"
        sx={{
          width: '244px',
          pt: 1,
          cursor: 'pointer'
        }}
        src='/images/ms-login.svg'
        alt='ms-login'
        onClick={msLogin}
      />
    </>
  )
}

export default MicrosoftLoginButton
