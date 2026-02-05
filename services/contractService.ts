import { Contract } from '../types';
import { apiClient } from './apiClient';

export const contractService = {
  fetchAll: async (): Promise<Contract[]> => {
    try {
      const data = await apiClient.get<Contract[]>('/contracts', 'select=*&order=created_at.desc');
      return data || [];
    } catch (error) {
      console.error('Error fetching contracts:', error);
      return [];
    }
  },

  add: async (contract: Omit<Contract, 'id' | 'created_at'>): Promise<Contract> => {
    const [data] = await apiClient.post<Contract[]>('/contracts', contract);
    return data;
  },

  update: async (id: string, updates: Partial<Contract>): Promise<Contract> => {
    const [data] = await apiClient.patch<Contract[]>(`/contracts?id=eq.${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete<void>(`/contracts?id=eq.${id}`);
  },

  fetchCategories: async (): Promise<string[]> => {
    try {
      const data = await apiClient.get<{ name: string }[]>('/contract_categories', 'select=name&order=name.asc');
      return data ? data.map(c => c.name) : [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  addCategory: async (name: string): Promise<void> => {
    await apiClient.post<{ name: string }[]>('/contract_categories', { name });
  },
};
