import axios from '../../../shared/api/axios'
import { ApiResponse } from '../../../shared/types/api.types'
import { Event, EventDetail, CreateEventInput } from '../../events/types'

type EventResponse = {
  _id?: string
  id?: string
  name: string
  startDate?: string
  endDate?: string
  eventLink?: string
  sheetId?: string
  sheetUrl?: string
  sheetCreated: boolean
  boothCount: number
  createdAt: string
  updatedAt: string
  totalBooths?: number
  lastBoothAt?: string
}

const mapEventResponse = (event: EventResponse): Event | EventDetail => {
  const id = event._id || event.id || ''
  return {
    ...event,
    id,
  } as Event | EventDetail
}

export const exhibitorEventsApi = {
  listEvents: async (): Promise<Event[]> => {
    const response = await axios.get<ApiResponse<{ events: EventResponse[] }>>(
      '/exhibitor/events'
    )
    return response.data.data.events.map(mapEventResponse) as Event[]
  },

  createEvent: async (input: CreateEventInput): Promise<Event> => {
    const response = await axios.post<ApiResponse<{ event: EventResponse }>>(
      '/exhibitor/events',
      input
    )
    return mapEventResponse(response.data.data.event) as Event
  },

  getEvent: async (id: string): Promise<EventDetail> => {
    const response = await axios.get<ApiResponse<{ event: EventResponse }>>(
      `/exhibitor/events/${id}`
    )
    return mapEventResponse(response.data.data.event) as EventDetail
  },
}
