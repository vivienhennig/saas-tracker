import Papa from 'papaparse';
import { Subscription } from '../types';

export const exportToCSV = (subscriptions: Subscription[]) => {
  const data = subscriptions.map((sub) => ({
    Name: sub.name,
    Kategorie: sub.category,
    Beschreibung: sub.description,
    'Monatliche Kosten': sub.monthlyCost,
    'Jährliche Kosten': sub.yearlyCost,
    Status: sub.status,
    Owner: sub.owner,
    Verlängerung: sub.renewalDate,
    Kündigung: sub.cancellationDate || '',
    Lizenzen: sub.quantity || 1,
    'Monate/Jahr': sub.monthsPerYear || 12,
    URL: sub.url,
  }));

  const csv = Papa.unparse(data, {
    delimiter: ';', // Deutsch-freundlich für Excel
    header: true,
  });

  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `saas-stack-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
