import { Backdrop, CircularProgress } from '@mui/material'

export default function LoadingBackdrop(props: { loading: boolean }) {
  return (
    <Backdrop
      sx={{ color: '#FFF', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      open={props.loading}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  )
}
