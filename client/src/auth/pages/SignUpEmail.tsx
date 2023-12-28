import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid/Grid'
import Link from '@mui/material/Link/Link'
import TextField from '@mui/material/TextField/TextField'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SiteSettings } from '../../SiteSettings'
import Button1 from '../../components/Button1'
import AccountApi from '../../logic/AccountApi'
import { lowercaseFirstLetter } from '../../logic/Utils'
import ApiException from '../../model/ApiException'
import AlphaLoginDisclaimer from '../components/AlphaLoginDisclaimer'
import AlreadyHaveAnAccount from '../components/AlreadyHaveAnAccount'
import AuthPageTitle from '../components/AuthPageTitle'
import LegalDisclaimer from '../components/LegalDisclaimer'

const api = new AccountApi()

const unapprovedEmailMessage = 'Email is not on the approved list'

interface FieldInfo {
  fieldName: string
  fieldValue: string
  fieldError?: string
}

type FormInfo = { [name: string]: FieldInfo }

const signUpFormInitial: FormInfo = {
  firstName: {
    fieldName: 'firstName',
    fieldValue: ''
  },
  lastName: {
    fieldName: 'lastName',
    fieldValue: ''
  },
  email: {
    fieldName: 'email',
    fieldValue: ''
  },
  password: {
    fieldName: 'password',
    fieldValue: ''
  }
}

export default function SignUpEmail() {
  const formWidth = '400px'

  const [formFields, setFormFields] = useState<FormInfo>(signUpFormInitial)

  const [message, setMessage] = useState<string>('')

  const navigate = useNavigate()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    const res = await api.signUp(formFields['firstName'].fieldValue, formFields['lastName'].fieldValue, formFields['email'].fieldValue, formFields['password'].fieldValue)
    if (res.isError()) {
      if (res.statusCode === 400) {
        setMessage('Some info provided was not valid')
        populateErrors(res.exception)
        return
      }
      if (res.exception?.message.includes(unapprovedEmailMessage)) {
        setMessage(unapprovedEmailMessage)
        return
      }
      setMessage('an unexpected error occurred')
      return
    }
    navigate('/sign-up-next')
  }

  const populateErrors = (ex: ApiException | null) => {
    if (ex === null || !ex.errors) return
    const updatedFormFields = { ...formFields }
    for (const validationError of ex.errors) {
      const fieldName = lowercaseFirstLetter(validationError.fieldName)
      if (!updatedFormFields[fieldName]) continue
      updatedFormFields[fieldName] = {
        ...updatedFormFields[fieldName],
        fieldError: validationError.errors[0]
      }
    }
    setFormFields(updatedFormFields)
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const fieldName = event.target.name
    setFormFields({
      ...formFields,
      [fieldName]: { ...formFields[fieldName], fieldValue: event.target.value, fieldError: undefined }
    })
  }

  return (
    <Box sx={{ marginTop: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', }}>
      <AlphaLoginDisclaimer />
      <AuthPageTitle>Sign Up</AuthPageTitle>
      <LegalDisclaimer />
      <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1, maxWidth: formWidth }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              value={formFields['firstName'].fieldValue}
              onChange={e => handleChange(e)}
              autoComplete="given-name"
              name="firstName"
              fullWidth
              id="firstName"
              label="First Name"
              autoFocus
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              value={formFields['lastName'].fieldValue}
              onChange={e => handleChange(e)}
              fullWidth
              id="lastName"
              label="Last Name"
              name="lastName"
              autoComplete="family-name"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              value={formFields['email'].fieldValue}
              onChange={e => handleChange(e)}
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              helperText={formFields['email'].fieldError}
              error={!!formFields['email'].fieldError}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              value={formFields['password'].fieldValue}
              onChange={e => handleChange(e)}
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              helperText={formFields['password'].fieldError}
              error={!!formFields['password'].fieldError}
            />
          </Grid>
        </Grid>
        <Button1 type="submit" sx={{ mt: 3, mb: 2 }}>
          Sign Up
        </Button1>
        {message && <Box sx={{ pb: '1rem', maxWidth: formWidth }}>
          <Alert severity="error">{message}</Alert>
        </Box>}
        {SiteSettings.ENABLE_EXTERNAL_LOGINS && <Box sx={{ textAlign: 'center' }}>
          Or, go back to <Link href="/sign-up-external">external account registration</Link>
        </Box>}
        <Box sx={{ textAlign: 'center' }}>
          <AlreadyHaveAnAccount />
          <Link href="/sign-up-resend-email">Resend verification email</Link>
        </Box>
      </Box>
    </Box>
  )
}
