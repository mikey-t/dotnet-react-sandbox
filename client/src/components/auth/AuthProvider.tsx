import React, { useEffect, useMemo, useState } from 'react'
import AccountApi from '../../logic/AccountApi'
import { User } from '../../model/models'

const api = new AccountApi()

export interface AuthContextType {
  user: User | null
  login: (user: User, callback: VoidFunction) => void
  logout: (callback: VoidFunction) => void
}

const AuthContext = React.createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>()
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true)

  useEffect(() => {
    let isCancelled = false
    api
      .me()
      .then((meResponse) => {
        if (meResponse.isError()) {
          return
        }
        if (!isCancelled) {
          if (meResponse.data === null) {
            setUser(null)
          }
          const userFromResponse = new User(meResponse.data!)
          setUser(userFromResponse)
        }
      })
      .finally(() => {
        if (!isCancelled) setLoadingInitial(false)
      })

    return () => {
      isCancelled = true
    }
  }, [])

  function login(user: User, callback: VoidFunction) {
    setUser(new User(user))
    setTimeout(() => {
      callback()
    }, 100)
  }

  function logout(callback: VoidFunction) {
    api.logout().then(() => {
      setUser(null)
      callback()
    }).catch(err => {
      console.error('error logging out', err)
    })
  }

  const memoValue = useMemo(() => ({
    user,
    login,
    logout,
  }), [user])

  return (
    <AuthContext.Provider value={memoValue as AuthContextType}>
      {!loadingInitial && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return React.useContext(AuthContext)
}
