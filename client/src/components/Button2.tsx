import Button, { ButtonProps } from '@mui/material/Button'
import React from 'react'

interface Button2Props extends Omit<ButtonProps, 'component'> {
}

const Button2: React.FC<Button2Props> = ({ sx, children, ...buttonProps }) => {
  return (
    <Button
      variant="outlined"
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

export default Button2
