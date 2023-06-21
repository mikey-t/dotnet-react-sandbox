import ApiResponse from '../model/ApiResponse'
import ApiBase from './ApiBase'

export default class ProtectedApi extends ApiBase {
    async getProtectedTest(): Promise<ApiResponse<string | null>> {
        return await this.get<string>('protected/test')
    }
}
