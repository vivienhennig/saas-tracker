import { Contract } from '../types';

export const exportContractsToCSV = (contracts: Contract[]) => {
  if (!contracts.length) return;

  const headers = [
    'Partner',
    'Beschreibung',
    'Kategorie',
    'Event',
    'Zyklus',
    'Betrag (Netto)',
    'Währung',
    'Status',
    'Erstellt am',
  ];

  const rows = contracts.map((c) => [
    c.provider,
    c.description || '',
    c.category || 'Other',
    c.assigned_event || '',
    c.billing_cycle,
    c.amount.toFixed(2),
    c.currency,
    c.status,
    new Date(c.created_at || Date.now()).toLocaleDateString('de-DE'),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `contracts_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
