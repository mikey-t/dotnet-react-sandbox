export class User {
  id: number = 0
  email: string = ''
  displayName: string = ''
  roles: UserRole[] = []

  constructor(data?: Partial<User>) {
    if (!data || typeof data === 'string' || data.id === 0) {
      throw new Error('cannot construct User object - invalid data')
    }
    Object.assign(this, data)
  }

  hasRole = (role: UserRole): boolean => {
    return this.roles.includes(role)
  }

  get isSuperAdmin(): boolean {
    return this.roles.includes('SUPER_ADMIN')
  }
}

export type UserRole = 'USER' | 'SUPER_ADMIN' | 'CONTENT_CREATOR'

export interface LoginRequest {
  email: string,
  password: string
}

export interface UserResponse {
  username: string
}

export interface IdResponse {
  id: number
}

export class ImageMeta {
  constructor(public id: string, public ext: string, public alt: string) {
  }
}

export class Deck {
  constructor(
    public id: number,
    public title: string,
    public description: string,
    public tags: string[],
    public authorId: number,
    public imageMeta: ImageMeta | null,
    public cards: Card[],
    public isPublic: boolean,
    public copiedFromId: number | null,) {
  }
}

export class Card {
  constructor(
    public id: number,
    public deckId: number,
    public frontText: string,
    public backText: string,
    public frontImageMeta: ImageMeta | null,
    public backImageMeta: ImageMeta | null,
    public knownData: KnownDataPoint[],
    public createdAt: Date,
    public enabled: boolean
  ) {
  }
}

export interface StartSessionResponse {
  sessionId: number
  cardOrder: number[]
  firstCard: Card
}

export interface KnownDataPoint {
  known: boolean
  timestamp: Date
}

export interface PlaySessionResult {
  playSessionId: number
  deckId: number
  startedAt: Date
  finishedAt: Date
  sessionCards: SessionCard[]
}

export interface SessionCard {
  cardId: number
  known: boolean | null
  startedAt: Date
  finishedAt: Date
}

export interface ValidationError {
  fieldName: string
  errors: string[]
}

export interface ValidationProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  errors?: Map<string, string[]>
}

export interface LinkInfo {
  title: string
  location: string
}
