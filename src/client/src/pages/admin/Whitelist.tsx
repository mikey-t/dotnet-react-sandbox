import {Alert, Checkbox, FormControl, FormControlLabel, Input, InputLabel, Stack} from '@mui/material'
import Button from '@mui/material/Button'
import React, {useEffect, useRef, useState} from 'react'
import AdminApi from '../../logic/AdminApi'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TableBody from '@mui/material/TableBody'
import TableContainer from '@mui/material/TableContainer'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'
import {useSnackbar} from 'notistack'

const api = new AdminApi()

export default function Whitelist() {
  const [loading, setLoading] = useState<boolean>(true)
  const [allEmails, setAllEmails] = useState<string[]>([])
  const [emailToAdd, setEmailToAdd] = useState<string>('')
  const [error, setError] = useState<string>('')
  const emailRef = useRef(null)
  const {enqueueSnackbar} = useSnackbar()

  const add = async (e: any) => {
    e.preventDefault()

    const res = await api.addToLoginWhitelist(emailToAdd)
    if (res.isError()) {
      if (res.statusCode === 400) {
        setError('Invalid email')
      } else if(res.statusCode === 409) {
        setError('Duplicate')
      } else if (res.statusCode === 500) {
        setError('Server error')
      }
    } else {
      setAllEmails(prev => [...prev, emailToAdd])
      setEmailToAdd('')
      setError('')
      enqueueSnackbar('Added email to whitelist', {variant: 'success'})
    }

    // @ts-ignore
    emailRef.current?.focus()
  }
  
  const remove = async (email: string) => {
    try {
      await api.removeFromLoginWhitelist(email)
      setAllEmails(prev => prev.filter(e => e !== email))
      enqueueSnackbar('Removed email from whitelist', {variant: 'success'})
    } catch (err) {
      console.error(err)
      setError('Server error removing email from whitelist')
    }
  }

  useEffect(() => {
    api.getLoginWhitelist().then(res => {
      if (res.isError()) {
        setError('server error loading login whitelist')
        return
      }
      setAllEmails(res.data!)
    }).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <h1>Login Whitelist</h1>
      <Stack spacing={2} direction="row">
        <form onSubmit={add}>
          <FormControl ref={emailRef} sx={{pr: 3}}>
            <InputLabel htmlFor="my-input">Email address</InputLabel>
            <Input
              tabIndex={0}
              sx={{width: '500px'}}
              value={emailToAdd}
              onChange={e => {
                setEmailToAdd(e.target.value)
                setError('')
              }}/>
          </FormControl>
          <Button tabIndex={1} type="submit" variant="outlined">Add</Button>
        </form>
      </Stack>
      {error && <Alert sx={{my: 2}} severity="error">{error}</Alert>}
      <br/>
      {loading && <CircularProgress sx={{m: 'auto'}}/>}
      {!loading && allEmails.length === 0 && <>no emails whitelisted</>}
      {!loading && allEmails.length > 0 &&
        <TableContainer component={Paper} sx={{mb: 5}}>
          <Table sx={{minWidth: 650}} aria-label="simple table">
            {/*<TableHead>*/}
            {/*  <TableRow>*/}
            {/*    <TableCell>Email</TableCell>*/}
            {/*    <TableCell align="right">Remove</TableCell>*/}
            {/*  </TableRow>*/}
            {/*</TableHead>*/}
            <TableBody>
              {allEmails.map((email) => (
                <TableRow
                  key={email}
                  hover
                  sx={{'&:last-child td, &:last-child th': {border: 0}}}
                >
                  <TableCell component="th" scope="row">
                    {email}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={_ => remove(email)}>
                      <DeleteIcon/>
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>}
    </>
  )
}
