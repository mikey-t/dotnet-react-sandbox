import * as React from 'react'
import Button from '@mui/material/Button'
import { MouseEventHandler, ReactNode } from 'react'


interface Button1Props {
  onClick?: MouseEventHandler | undefined
  startIcon?: ReactNode,
  children: ReactNode
}

export default function Button2(props: Button1Props) {
  return (
    <Button
      variant="outlined"
      sx={{
        display: "flex",
        alignItems: "center",
        fontSize: '16px',
        textTransform: 'none',
        width: 1
      }}
      onClick={props.onClick}
      startIcon={props.startIcon}
    >
      {props.children}
    </Button>
  )
}
