import Button, { ButtonProps } from '@mui/material/Button'
import React from 'react'

interface Button1Props extends Omit<ButtonProps, 'component'> {
}

const Button1: React.FC<Button1Props> = ({ sx, children, ...buttonProps }) => {
  return (
    <Button
      variant="contained"
      sx={{
        display: 'flex',
        alignItems: 'center',
        fontSize: '16px',
        textTransform: 'none',
        width: 1,
        ...sx,
      }}
      {...buttonProps}
    >
      {children}
    </Button>
  )
}

export default Button1
