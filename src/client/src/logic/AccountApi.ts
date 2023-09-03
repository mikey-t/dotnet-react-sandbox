import ApiBase from './ApiBase'
import { LoginRequest, User } from '../model/models'
import ApiResponse from '../model/ApiResponse'

export default class AccountApi extends ApiBase {
  async me(): Promise<ApiResponse<User | null>> {
    return await this.get<User>('account/me')
  }

  async login(loginRequest: LoginRequest): Promise<ApiResponse<User | null>> {
    return await this.post<User>('account/login', loginRequest)
  }

  async logout(): Promise<void> {
    const logoutResponse = await this.post('account/logout', {})
    if (logoutResponse.isError()) {
      throw new Error('error logging out', logoutResponse.exception?.toJson())
    }
  }

  async loginGoogle(credential: string): Promise<ApiResponse<User | null>> {
    return await this.post<User>('account/login-google', { credential })
  }

  async loginMicrosoft(code: string): Promise<ApiResponse<User | null>> {
    return await this.post<User>('account/login-microsoft', { code })
  }

  async register(firstName: string, lastName: string, email: string, password: string): Promise<ApiResponse<unknown>> {
    return await this.post<string>('account/register', {
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password
    })
  }

  async verifyEmail(code: string) {
    return await this.post<unknown>('account/verify-email', { code })
  }

  async resendVerificationEmail(email: string) {
    return await this.post<unknown>('account/resend-verification-email', { email })
  }
}
