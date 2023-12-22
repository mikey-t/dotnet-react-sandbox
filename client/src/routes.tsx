import { RouteObject } from 'react-router-dom'
import MainLayout from './layout/MainLayout'
import { rootLoader } from './loaders/rootLoader'
import Blog from './pages/Blog'
import ContentPolicy from './pages/ContentPolicy'
import ErrorPage from './pages/ErrorPage'
import Home from './pages/Home'
import Pricing from './pages/Pricing'
import Privacy from './pages/Privacy'
import Products from './pages/Products'
import Terms from './pages/Terms'

export const routes: RouteObject[] = [
  {
    path: '/',
    id: 'root',
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    loader: rootLoader,
    children: [{
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          element: <Home />
        },
        {
          path: 'products',
          element: <Products />
        },
        {
          path: 'pricing',
          element: <Pricing />
        },
        {
          path: 'blog',
          element: <Blog />
        },
        {
          path: 'privacy',
          element: <Privacy />
        },
        {
          path: 'terms',
          element: <Terms />
        },
        {
          path: 'content-policy',
          element: <ContentPolicy />
        },
      ]
    }]
  }
]
