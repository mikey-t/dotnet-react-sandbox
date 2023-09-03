import { IValidationProblemDetails } from './models'

export default class ApiException extends Error {
  constructor(public code: number, public message: string, public errors: { [key: string]: string[] } = {}) {
    super()
  }

  toJson(): ApiException {
    return JSON.parse(JSON.stringify(this))
  }

  static fromValidationExceptionResponseData(code: number, data: IValidationProblemDetails): ApiException {
    const ex = new ApiException(code, data.detail || data.title || '')

    if (!data.errors) {
      return ex
    }

    ex.errors = data.errors

    return ex
  }
}
