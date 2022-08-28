export default class ApiException extends Error {
  constructor(public code: number, public message: string, public errors: { [key: string]: string } = {}) {
    super()
  }
  
  toJson(): any {
    return JSON.parse(JSON.stringify(this))
  }

  static fromValidationExceptionResponseData(code: number, data: any): ApiException {
    let ex = new ApiException(code, data['detail'] || data['title'] || '')

    if (!data['errors']) {
      return ex
    }

    let errors: { [key: string]: string } = {}

    for (let key in data['errors']) {
      errors[key] = data['errors'][key]
    }

    ex.errors = errors

    return ex
  }
}
