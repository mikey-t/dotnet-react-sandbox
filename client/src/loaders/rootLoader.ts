import { authProvider } from '../auth'

export function rootLoader(): string {
  return authProvider.username
}
