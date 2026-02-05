import { useState, useCallback } from 'react';
import { Event } from '../types';
import { eventService } from '../services/eventService';
import { toast } from 'sonner';

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await eventService.fetchAll();
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
      // toast.error('Events konnten nicht geladen werden.'); // Optional, maybe too noisy on init
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddEvent = async (newEvent: Omit<Event, 'id'>) => {
    try {
      await eventService.add(newEvent);
      toast.success('Event erfolgreich angelegt');
      loadEvents();
      return true;
    } catch (error) {
      console.error('Failed to add event:', error);
      toast.error('Fehler beim Speichern des Events');
      return false;
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await eventService.delete(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast.success('Event gelöscht');
      return true;
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error('Fehler beim Löschen');
      return false;
    }
  };

  return {
    events,
    loading,
    loadEvents,
    handleAddEvent,
    handleDeleteEvent,
  };
};
