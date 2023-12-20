import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  // React strict mode kinda sucks right now in react 18. For example, it will always mount components twice, but only in dev mode.
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
)
