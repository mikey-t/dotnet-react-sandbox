import * as React from 'react'
import Button from '@mui/material/Button'
import {MouseEventHandler, ReactNode} from 'react'
import {SxProps, Theme} from '@mui/material'

interface Button1Props {
  onClick?: MouseEventHandler | undefined
  startIcon?: ReactNode,
  children: ReactNode,
  type?: 'button' | 'reset' | 'submit'
  sx?: SxProps<Theme>
}

export default function Button1(props: Button1Props) {
  return (
    <Button
      variant="contained"
      sx={[{
        display: 'flex',
        alignItems: 'center',
        fontSize: '16px',
        textTransform: 'none',
        width: 1
      },
        ...(!!props.sx ? Array.isArray(props.sx) ? props.sx : [props.sx] : [])
      ]}
      onClick={props.onClick}
      startIcon={props.startIcon}
      type={props.type || 'button'}
    >
      {props.children}
    </Button>
  )
}
