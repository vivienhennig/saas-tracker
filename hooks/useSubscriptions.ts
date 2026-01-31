import { useState } from 'react';
import { Subscription } from '../types';
import { databaseService } from '../services/databaseService';
import { toast } from 'sonner';

export const useSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await databaseService.fetchAll();
      setSubscriptions(data);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
      toast.error('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (newSub: Omit<Subscription, 'id'>) => {
    try {
      const added = await databaseService.add(newSub);
      setSubscriptions((prev) => [added, ...prev]);
      toast.success('Tool erfolgreich hinzugefügt');
    } catch (err) {
      toast.error('Fehler beim Speichern');
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Subscription>) => {
    try {
      const updated = await databaseService.update(id, updates);
      setSubscriptions((prev) => prev.map((s) => (s.id === id ? updated : s)));
      toast.success('Tool erfolgreich aktualisiert');
      return updated;
    } catch (err) {
      toast.error('Fehler beim Update');
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await databaseService.remove(id);
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
      toast.success('Tool erfolgreich gelöscht');
    } catch (err) {
      toast.error('Löschen fehlgeschlagen');
      throw err;
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => databaseService.remove(id)));
      setSubscriptions((prev) => prev.filter((s) => !ids.includes(s.id)));
      toast.success(`${ids.length} Tools erfolgreich gelöscht`);
    } catch (err) {
      toast.error('Fehler beim Bulk-Löschen');
      throw err;
    }
  };

  const handleBulkUpdate = async (ids: string[], updates: Partial<Subscription>) => {
    try {
      const updatedTools = await Promise.all(ids.map((id) => databaseService.update(id, updates)));
      setSubscriptions((prev) =>
        prev.map((s) => {
          const updated = updatedTools.find((u) => u.id === s.id);
          return updated ? updated : s;
        }),
      );
      toast.success(`${ids.length} Tools erfolgreich aktualisiert`);
    } catch (err) {
      toast.error('Fehler beim Bulk-Update');
      throw err;
    }
  };

  return {
    subscriptions,
    loading,
    loadData,
    handleAdd,
    handleUpdate,
    handleDelete,
    handleBulkDelete,
    handleBulkUpdate,
  };
};
