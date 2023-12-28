import { PublicClientApplication } from '@azure/msal-browser'
import { Configuration } from '@azure/msal-browser/dist/config/Configuration'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress/CircularProgress'
import React, { useEffect, useState } from 'react'
import { SiteSettings } from '../../SiteSettings'
import Button1 from '../../components/Button1'
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
  isParentPageLoading: boolean
  setLoading: (loading: boolean) => void
}

const MicrosoftLoginButton: React.FC<MicrosoftLoginButtonProps> = ({ onFailure, onWhitelistFailure, onSuccess, isParentPageLoading, setLoading }) => {
  const [loading] = useState<boolean>(isParentPageLoading)
  const [initializing, setInitializing] = useState<boolean>(true)

  useEffect(() => {
    let canceled = false
    const initMsal = async () => {
      await msalInstance.initialize()
      if (!canceled) {
        setInitializing(false)
      }
    }

    initMsal()

    return () => {
      canceled = true
    }
  }, [])

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
      {initializing &&
        <Box sx={{ width: '400px', alignItems: 'center' }}>
          <Button1
            disabled
            variant="outlined"
            sx={{ width: '244px', m: 'auto', mt: 1 }}
            startIcon={<CircularProgress size="1rem" color="inherit" />}
          >
            Sign in with Microsoft
          </Button1>
        </Box>
      }
      {!initializing &&
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
      }
    </>
  )
}

export default MicrosoftLoginButton
