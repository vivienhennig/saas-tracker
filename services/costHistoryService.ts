import { CostHistoryEntry, Subscription } from '../types';

const CLOUD_URL = import.meta.env.VITE_SUPABASE_URL || '';
const CLOUD_KEY = import.meta.env.VITE_SUPABASE_KEY || '';
const isCloudEnabled = !!(CLOUD_URL && CLOUD_KEY);

export const costHistoryService = {
  // Snapshot erstellen (für ein einzelnes Tool)
  recordSnapshot: async (subscription: Subscription) => {
    if (!isCloudEnabled) return;

    try {
      const response = await fetch(`${CLOUD_URL}/rest/v1/cost_history`, {
        method: 'POST',
        headers: {
          apikey: CLOUD_KEY,
          Authorization: `Bearer ${CLOUD_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          subscription_id: subscription.id,
          monthly_cost: subscription.monthlyCost,
          yearly_cost: subscription.yearlyCost,
          status: subscription.status,
          recorded_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record history snapshot');
      }
    } catch (error) {
      console.error('Error recording history:', error);
    }
  },

  // Historie für ein Tool abrufen
  getHistory: async (subscriptionId: string): Promise<CostHistoryEntry[]> => {
    if (!isCloudEnabled) return [];

    try {
      const response = await fetch(
        `${CLOUD_URL}/rest/v1/cost_history?subscription_id=eq.${subscriptionId}&order=recorded_at.asc`,
        {
          method: 'GET',
          headers: {
            apikey: CLOUD_KEY,
            Authorization: `Bearer ${CLOUD_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
    return [];
  },

  // Gesamthistorie abrufen (für Analytics)
  getAllHistory: async (): Promise<CostHistoryEntry[]> => {
    if (!isCloudEnabled) return [];

    try {
      const response = await fetch(`${CLOUD_URL}/rest/v1/cost_history?order=recorded_at.asc`, {
        method: 'GET',
        headers: {
          apikey: CLOUD_KEY,
          Authorization: `Bearer ${CLOUD_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching all history:', error);
    }
    return [];
  },
};
