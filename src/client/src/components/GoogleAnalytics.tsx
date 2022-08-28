import {useEffect} from 'react'
import {useLocation} from 'react-router-dom'
import gtag from '../logic/gtag'
import EnvHelper from '../logic/EnvHelper'

if (EnvHelper.isProduction()) {
  gtag('config', 'G-BMCBFZ395Z', {
    send_page_view: false
  })
}

export default function GoogleAnalytics(props: any) {
  const location = useLocation()

  useEffect(() => {
    if (EnvHelper.isProduction()) {
      gtag('event', 'page_view', {
        'page_location': location.pathname
      })
    }
  }, [location.pathname])

  return props.children
}
