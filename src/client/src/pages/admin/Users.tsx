import React, { useEffect, useState } from 'react'
import { User } from '../../model/models'
import AdminApi from '../../logic/AdminApi'
import LoadingBackdrop from '../../components/LoadingBackdrop'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import { Checkbox, FormControlLabel, Grid } from '@mui/material'

const api = new AdminApi()

const CONTENT_CREATOR_ROLE = 'CONTENT_CREATOR'

export default function Users() {
  const [loading, setLoading] = useState<boolean>(true)
  const [users, setUsers] = useState<User[]>([])

  const toggleUserContentCreator = async (userId: number, current: boolean) => {
    setLoading(true)
    await api.setUserContentCreator(userId, !current)

    const usersTemp = [...users]
    const user = usersTemp.filter(u => u.id === userId)[0]
    if (!current) {
      user.roles.push(CONTENT_CREATOR_ROLE)
    } else {
      user.roles = user.roles.filter(r => r !== CONTENT_CREATOR_ROLE)
    }
    setUsers(usersTemp)

    setLoading(false)
  }

  useEffect(() => {
    api.getAllUsers()
      .then(res => {
        if (res.isError()) {
          console.error(res.exception?.toJson())
          return
        }
        setUsers(res.data!)
      })
      .catch(err => {
        console.error(err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <>
      <LoadingBackdrop loading={loading} />
      <h1>Users</h1>
      <TableContainer component={Paper} sx={{ mb: 5 }}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell align="right">{CONTENT_CREATOR_ROLE}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                hover
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {user.email}
                </TableCell>
                <TableCell align="right">
                  <FormControlLabel label="" control={<Checkbox
                    checked={user.roles.includes(CONTENT_CREATOR_ROLE)}
                    onChange={_ => toggleUserContentCreator(user.id, user.roles.includes(CONTENT_CREATOR_ROLE))}
                  />} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}
