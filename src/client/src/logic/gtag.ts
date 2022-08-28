declare global {
  interface Window {
    gtag: Gtag.Gtag
    dataLayer: Record<string, any>
  }
}

const gtag = window && window.gtag

export default gtag
