
export enum SubscriptionStatus {
  ACTIVE = 'Aktiv',
  TRIAL = 'Testphase',
  PAUSED = 'Pausiert',
  EXPIRED = 'Abgelaufen',
  INACTIVE = 'Inaktiv'
}

export const TOOL_CATEGORIES = [
  'Eventmanagement',
  'Marketing',
  'Automation',
  'Audio & Video',
  'Podcast',
  'Webseite',
  'Grafik',
  'HR',
  'Finance',
  'Sales',
  'Administration'
] as const;

export type ToolCategory = typeof TOOL_CATEGORIES[number];

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
