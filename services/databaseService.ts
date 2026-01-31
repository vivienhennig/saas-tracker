import { Subscription } from '../types';

// Wir nutzen hier import.meta.env (Standard für Vite) statt process.env
const CLOUD_URL = import.meta.env.VITE_SUPABASE_URL || '';
const CLOUD_KEY = import.meta.env.VITE_SUPABASE_KEY || '';
const LOCAL_STORAGE_KEY = 'saasstack_subscriptions';

const isCloudEnabled = !!(CLOUD_URL && CLOUD_KEY);

// Helper: Remove fields that don't exist in Supabase schema
const sanitizeForDb = (sub: Partial<Subscription>): Partial<Subscription> => {
  const { ...rest } = sub;
  return rest;
};

export const databaseService = {
  async fetchAll(): Promise<Subscription[]> {
    if (isCloudEnabled) {
      try {
        const response = await fetch(
          `${CLOUD_URL}/rest/v1/subscriptions?select=*&order=created_at.desc`,
          {
            method: 'GET',
            headers: {
              apikey: CLOUD_KEY,
              Authorization: `Bearer ${CLOUD_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (response.ok) return await response.json();
      } catch (err) {
        console.warn('Cloud-Fetch fehlgeschlagen, nutze Fallback.');
      }
    }

    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    return local ? JSON.parse(local) : [];
  },

  async add(sub: Omit<Subscription, 'id'>): Promise<Subscription> {
    if (isCloudEnabled) {
      try {
        const response = await fetch(`${CLOUD_URL}/rest/v1/subscriptions`, {
          method: 'POST',
          headers: {
            apikey: CLOUD_KEY,
            Authorization: `Bearer ${CLOUD_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify(sanitizeForDb(sub)),
        });
        if (response.ok) {
          const data = await response.json();
          return data[0];
        }
      } catch (err) {
        console.error('Cloud-Add fehlgeschlagen.');
      }
    }

    const newSub = { ...sub, id: Math.random().toString(36).substr(2, 9) };
    const current = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const updated = [newSub, ...current];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return newSub;
  },

  async update(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    if (isCloudEnabled) {
      try {
        const response = await fetch(`${CLOUD_URL}/rest/v1/subscriptions?id=eq.${id}`, {
          method: 'PATCH',
          headers: {
            apikey: CLOUD_KEY,
            Authorization: `Bearer ${CLOUD_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify(sanitizeForDb(updates)),
        });
        if (response.ok) {
          const data = await response.json();
          return data[0];
        }
      } catch (err) {
        console.error('Cloud-Update fehlgeschlagen.');
      }
    }

    const current = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const updated = current.map((s: Subscription) => (s.id === id ? { ...s, ...updates } : s));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    const result = updated.find((s: Subscription) => s.id === id);
    if (!result) throw new Error('Tool nicht gefunden');
    return result;
  },

  async remove(id: string): Promise<void> {
    if (isCloudEnabled) {
      try {
        const response = await fetch(`${CLOUD_URL}/rest/v1/subscriptions?id=eq.${id}`, {
          method: 'DELETE',
          headers: {
            apikey: CLOUD_KEY,
            Authorization: `Bearer ${CLOUD_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) return;
      } catch (err) {
        console.error('Cloud-Delete fehlgeschlagen.');
      }
    }

    const current = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify(current.filter((s: Subscription) => s.id !== id))
    );
  },
};

// Dummy-Funktion für Kompatibilität
export const getDbConfig = () => ({ url: '', apiKey: '', isConnected: isCloudEnabled });
export const saveDbConfig = () => {};
