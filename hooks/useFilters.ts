import { useState, useMemo } from 'react';
import { Subscription, SubscriptionStatus } from '../types';

type FilterTab = 'Alle' | 'Aktiv' | 'Inaktiv' | 'Demnächst fällig';

export const useFilters = (subscriptions: Subscription[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('Alle');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);

  const filteredSubs = useMemo(() => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return subscriptions.filter((s) => {
      const toolName = (s.name || '').toLowerCase();
      const toolCategory = (s.category || '').toLowerCase();
      const toolOwner = (s.owner || '').toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        toolName.includes(search) || toolCategory.includes(search) || toolOwner.includes(search);

      let matchesTab = true;
      if (activeTab === 'Aktiv')
        matchesTab = s.status === SubscriptionStatus.ACTIVE || s.status === SubscriptionStatus.TRIAL;
      if (activeTab === 'Inaktiv') matchesTab = s.status === SubscriptionStatus.INACTIVE;
      if (activeTab === 'Demnächst fällig') {
        const renewal = new Date(s.renewalDate);
        matchesTab = renewal >= now && renewal <= sevenDaysFromNow;
      }

      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(s.category);

      let matchesOwner = selectedOwners.length === 0;
      if (!matchesOwner) {
        matchesOwner = selectedOwners.some((owner) => {
          if (owner === 'Vivien Hennig') return s.owner === 'Vivien Hennig' || s.owner === 'Vivi';
          return s.owner === owner;
        });
      }

      return matchesSearch && matchesTab && matchesCategory && matchesOwner;
    });
  }, [subscriptions, searchTerm, activeTab, selectedCategories, selectedOwners]);

  return {
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    selectedCategories,
    setSelectedCategories,
    selectedOwners,
    setSelectedOwners,
    filteredSubs,
  };
};
