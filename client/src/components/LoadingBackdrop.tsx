import { Backdrop, CircularProgress } from '@mui/material'

export default function LoadingBackdrop({ loading }: { loading: boolean }) {
  return (
    <Backdrop sx={{ color: '#FFF', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
      <CircularProgress color="inherit" />
    </Backdrop>
  )
}
