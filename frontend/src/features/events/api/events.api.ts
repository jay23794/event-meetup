import axios from '../../../shared/api/axios'
import { ApiResponse } from '../../../shared/types/api.types'
import { Event, EventDetail, CreateEventInput } from '../types'

export const eventsApi = {
  listEvents: async (): Promise<Event[]> => {
    const response = await axios.get<ApiResponse<{ events: Event[] }>>(
      '/events'
    )
    return response.data.data.events
  },

  createEvent: async (input: CreateEventInput): Promise<Event> => {
    const response = await axios.post<ApiResponse<{ event: Event }>>(
      '/events',
      input
    )
    return response.data.data.event
  },

  getEvent: async (id: string): Promise<EventDetail> => {
    const response = await axios.get<ApiResponse<{ event: EventDetail }>>(
      `/events/${id}`
    )
    return response.data.data.event
  },
}
