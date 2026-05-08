export interface Event {
  id: string
  name: string
  startDate?: string
  endDate?: string
  sheetId?: string
  sheetUrl?: string
  sheetCreated: boolean
  boothCount: number
  createdAt: string
  updatedAt: string
}

export interface EventDetail extends Event {
  totalBooths: number
  lastBoothAt?: string
}

export interface CreateEventInput {
  name: string
  startDate?: string
  endDate?: string
}
