import ApiException from './ApiException'

export default class ApiResponse<T> {
  public statusCode: number
  public data: T | null
  public exception: ApiException | null
  
  constructor(statusCode: number, data: T | null, exception: ApiException | null = null) {
    this.statusCode = statusCode
    this.data = data
    this.exception = exception
  }
  
  isError(): boolean {
    return this.statusCode < 200 || this.statusCode >= 300
  }
}
