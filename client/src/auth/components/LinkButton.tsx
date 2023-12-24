import Button, { ButtonProps } from '@mui/material/Button'
import React from 'react'
import { Link, To } from 'react-router-dom'

interface LinkButtonProps extends Omit<ButtonProps, 'component'> {
  to: To
}

const LinkButton: React.FC<LinkButtonProps> = ({ to, sx, children, ...buttonProps }) => {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <Button
        variant="contained"
        sx={{
          textTransform: 'none',
          fontSize: '1rem',
          width: 1,
          ...sx,
        }}
        {...buttonProps}
      >
        {children}
      </Button>
    </Link>
  )
}

export default LinkButton
