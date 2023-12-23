import Button from '@mui/material/Button/Button'
import { useState } from 'react'
import ProtectedApi from '../../logic/ProtectedApi'
import PageTitle from '../../components/PageTitle'

const api = new ProtectedApi()

export default function Account() {
  const [data, setData] = useState<string>('')

  const getData = async () => {
    const res = await api.getProtectedTest()
    if (res.isError()) {
      console.log(res.exception?.toJson())
      return
    }

    setData(res.data || '')
  }

  const clear = () => {
    setData('')
  }

  return (
    <>
      <PageTitle>Account</PageTitle>
      <p>This page requires authentication.</p>
      <Button variant="contained" onClick={getData}>Test protected endpoint</Button>&nbsp;
      <Button variant="contained" onClick={clear}>Clear</Button>
      <div>{data}</div>
    </>
  )
}
