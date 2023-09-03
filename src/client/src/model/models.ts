export interface User {
  id: number
  email: string
  displayName: string
  roles: string[]
}

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

export interface IValidationProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  errors?: { [key: string]: string[] }
}
