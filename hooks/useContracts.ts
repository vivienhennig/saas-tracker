import { useState, useCallback } from 'react';
import { Contract } from '../types';
import { contractService } from '../services/contractService';
import { toast } from 'sonner';

export const useContracts = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<string[]>([]);

  const loadContracts = useCallback(async () => {
    setLoading(true);
    try {
      const [contractsData, categoriesData] = await Promise.all([
        contractService.fetchAll(),
        contractService.fetchCategories()
      ]);
      setContracts(contractsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load contracts data:', error);
      toast.error('Daten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddContract = async (newContract: Omit<Contract, 'id'>) => {
    try {
      await contractService.add(newContract);
      toast.success('Vertrag erfolgreich angelegt');
      loadContracts();
      return true;
    } catch (error) {
      console.error('Failed to add contract:', error);
      toast.error('Fehler beim Speichern des Vertrags');
      return false;
    }
  };

  const handleAddCategory = async (name: string) => {
    try {
      await contractService.addCategory(name);
      // Optimistic update
      setCategories(prev => [...prev, name].sort()); 
      return true;
    } catch (error) {
      console.error('Failed to add category:', error);
      // toast.error('Fehler beim Speichern der Kategorie'); // Optional, maybe suppress if it's a "silent" addition
      return false;
    }
  };

  const handleDeleteContract = async (id: string) => {
    try {
      await contractService.delete(id);
      setContracts((prev) => prev.filter((c) => c.id !== id));
      toast.success('Vertrag gelöscht');
      return true;
    } catch (error) {
      console.error('Failed to delete contract:', error);
      toast.error('Fehler beim Löschen');
      return false;
    }
  };

  const handleUpdateContract = async (id: string, updates: Partial<Contract>) => {
    try {
      await contractService.update(id, updates);
      setContracts((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
      toast.success('Vertrag aktualisiert');
      return true;
    } catch (error) {
      console.error('Failed to update contract:', error);
      toast.error('Fehler beim Aktualisieren');
      return false;
    }
  };

  return {
    contracts,
    categories,
    loading,
    loadContracts,
    handleAddContract,
    handleUpdateContract,
    handleDeleteContract,
    handleAddCategory,
  };
};
