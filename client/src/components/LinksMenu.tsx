import Link from '@mui/material/Link/Link'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import React, { ReactElement, useState } from 'react'
import { LinkInfo } from '../model/models'

interface LinksMenuProps {
  links: LinkInfo[]
  anchorElement: ReactElement
}

const LinksMenu = ({ links: pageNavList, anchorElement }: LinksMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const clonedAnchorElement = React.cloneElement(anchorElement, {
    onClick: handleClick,
  })

  return (
    <>
      {clonedAnchorElement}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        sx={{ mt: "45px" }}
        id="menu-appbar"
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        keepMounted
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        {pageNavList.map((navItem, index) => (
          <MenuItem key={index} onClick={handleClose}>
            <Link href={navItem.location} style={{ textDecoration: 'none', color: 'inherit' }}>{navItem.title}</Link>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export default LinksMenu
