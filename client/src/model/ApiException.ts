import { ValidationError, ValidationProblemDetails } from './models'

export default class ApiException extends Error {
  constructor(public code: number, public message: string, public errors: ValidationError[] = []) {
    super()
  }

  toJson(): ApiException {
    return JSON.parse(JSON.stringify(this))
  }

  static fromValidationExceptionResponseData(code: number, data: ValidationProblemDetails): ApiException {
    const ex = new ApiException(code, data.detail || data.title || '')

    if (!data.errors) {
      return ex
    }

    for (const error of Object.entries(data.errors)) {
      ex.errors.push({ fieldName: error[0], errors: error[1] })
    }

    return ex
  }
}
