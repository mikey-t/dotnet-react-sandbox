export default class EnvHelper {
  static isProduction() {
    return process.env.NODE_ENV === 'production'
  } 
}
