import ApiBase from './ApiBase'
import {User} from '../model/models'
import ApiResponse from '../model/ApiResponse'

export default class AdminApi extends ApiBase {
  async getAllUsers(): Promise<ApiResponse<User[] | null>> {
    return await this.get<User[]>('admin/user/all')
  }

  async setUserContentCreator(userId: number, isContentCreator: boolean): Promise<ApiResponse<any | null>> {
    return await this.post<any>(`admin/user/${userId}/content-creator/${isContentCreator}`, {})
  }

  async getLoginWhitelist(): Promise<ApiResponse<string[] | null>> {
    return await this.get<string[]>(`admin/login-whitelist/all`)
  }

  async addToLoginWhitelist(email: string): Promise<ApiResponse<any>> {
    return await this.post<any>(`admin/login-whitelist`, {Email: email})
  }

  async removeFromLoginWhitelist(email: string) {
    return await this.delete(`admin/login-whitelist/${encodeURIComponent(email)}`)
  }
}
