import { LinkProps, createTheme } from '@mui/material'
import React from 'react'
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom'

const linkColor = '#69cefe'
const visitedLinkColor = linkColor

const LinkBehavior = React.forwardRef<HTMLAnchorElement, Omit<RouterLinkProps, 'to'> & { href: RouterLinkProps['to'] }>((props, ref) => {
  const { href, ...other } = props
  // Map "href" (Material UI) -> "to" (react-router)
  return <RouterLink ref={ref} to={href} {...other} />
})

LinkBehavior.displayName = 'LinkBehavior'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ffffff',
    },
    secondary: {
      main: '#cccccc',
    },
  },
  components: {
    MuiLink: {
      defaultProps: {
        component: LinkBehavior,
      } as LinkProps,
      styleOverrides: {
        root: {
          color: linkColor,
          textDecoration: 'none',
          '&:visited': {
            color: visitedLinkColor,
            textDecoration: 'none'
          },
          '&:hover': {
            textDecoration: 'underline'
          },
        },
        underlineHover: true,
        underlineAlways: false
      },
    },
    MuiButtonBase: {
      defaultProps: {
        LinkComponent: LinkBehavior,
      },
    },
  },
})


