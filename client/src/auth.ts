interface AuthProvider {
  isAuthenticated: boolean
  username: string
  signIn(username: string): Promise<void>
  signOut(): Promise<void>
}

export const authProvider: AuthProvider = {
  isAuthenticated: false,
  username: '',
  signIn: async (username: string) => {
    authProvider.isAuthenticated = true
    authProvider.username = username
  },
  signOut: async () => {
    authProvider.isAuthenticated = false
    authProvider.username = ''
  }
}
