import { User } from '../model/models'

export default class UserLogic {
  static IsContentCreator(user: User | null) {
    if (user === null) {
      return false
    }
    return user.roles && user.roles.length > 0 && user.roles.includes('CONTENT_CREATOR')
  }
}
