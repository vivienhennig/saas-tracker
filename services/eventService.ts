import { Event } from '../types';
import { apiClient } from './apiClient';

export const eventService = {
  async fetchAll(): Promise<Event[]> {
    try {
      const data = await apiClient.get<Event[]>('/events', 'select=*&order=name.asc');
      return data || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  },

  async add(event: Omit<Event, 'id'>): Promise<Event> {
    const [data] = await apiClient.post<Event[]>('/events', event);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(`/events?id=eq.${id}`);
  },
};
