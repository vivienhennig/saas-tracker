
export enum SubscriptionStatus {
  ACTIVE = 'Aktiv',
  TRIAL = 'Testphase',
  PAUSED = 'Pausiert',
  EXPIRED = 'Abgelaufen',
  INACTIVE = 'Inaktiv'
}

export const TOOL_CATEGORIES = [
  'Administration',
  'Audio & Video',
  'Automation',
  'Eventmanagement',
  'Finance',
  'Grafik',
  'HR',
  'Infrastructure',
  'Marketing',
  'Podcast',
  'Sales',
  'Webseite',
] as const;

export type ToolCategory = typeof TOOL_CATEGORIES[number];

export const OWNERS = [
  'Bella Wondra',
  'Christiane Lübke',
  'Esther Schwan',
  'Manuel Winkler',
  'Sven Rittau',
  'Verena Lindner',
  'Verena Schlüpmann',
  'Seline Neuber',
  'Vivien Hennig'
] as const;

export type OwnerName = typeof OWNERS[number];

export interface Subscription {
  id: string;
  name: string;
  category: string;
  description: string;
  monthlyCost: number;
  yearlyCost: number;
  renewalDate: string;
  cancellationDate?: string;
  status: SubscriptionStatus;
  addedBy: string;
  owner: string; // Neue Eigenschaft
  url: string;
  quantity?: number; // Neue Eigenschaft für mehrere Lizenzen
}

export interface Stats {
  totalMonthly: number;
  totalYearly: number;
  activeTools: number;
  upcomingRenewals: number;
}

export interface DbConfig {
  url: string;
  apiKey: string;
  isConnected: boolean;
}
