export interface IEvents {
  content: Event[]
  page: Page
}

export interface Event {
  category: string
  date: string
  description?: string
  id: number
  isFavorite: boolean
  location: string
  ownerId: number
  ownerName: string
  status: string
  time: string
  title: string
}

export interface IEventDetail {
  category: string
  date: string
  description: string
  id: number
  isFavorite: boolean
  location: string
  ownerId: number
  ownerName: string
  participantCount: number
  status: string
  time: string
  title: string
}


export interface Page {
  size: number
  number: number
  totalElements: number
  totalPages: number
}
