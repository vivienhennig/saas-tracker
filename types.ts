export enum SubscriptionStatus {
  ACTIVE = 'Aktiv',
  TRIAL = 'Testphase',
  PAUSED = 'Pausiert',
  EXPIRED = 'Abgelaufen',
  INACTIVE = 'Inaktiv',
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

export type ToolCategory = (typeof TOOL_CATEGORIES)[number];

export const OWNERS = [
  'Bella Wondra',
  'Christiane Lübke',
  'Esther Schwan',
  'Manuel Winkler',
  'Sven Rittau',
  'Verena Lindner',
  'Verena Schlüpmann',
  'Seline Neuber',
  'Vivien Hennig',
] as const;

export type OwnerName = (typeof OWNERS)[number];

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
  quantity?: number;
  monthsPerYear?: number;
  usageMonths?: number[];
  billingCycle: 'monthly' | 'yearly';
  notes?: string; // Freitext-Notizen
  tags?: string[]; // Array von Tags
}

// Predefined Tags
export const PREDEFINED_TAGS = [
  'kritisch',
  'kündigen',
  'evaluieren',
  'wichtig',
  'optional',
  'veraltet',
  'team',
  'personal',
] as const;

export type PredefinedTag = (typeof PREDEFINED_TAGS)[number];

export interface Stats {
  totalMonthly: number;
  totalYearly: number;
  activeTools: number;
  upcomingRenewals: number;
}

export interface CostHistoryEntry {
  id: string;
  subscription_id: string;
  recorded_at: string;
  monthly_cost: number;
  yearly_cost: number;
  status: SubscriptionStatus;
}

// Sort Configuration
export type SortField = 'name' | 'monthlyCost' | 'yearlyCost' | 'renewalDate' | 'status' | 'owner';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export interface DbConfig {
  url: string;
  apiKey: string;
  isConnected: boolean;
}

// --- Contact Types ---

export type ContractCategory = string;

export type ContractStatus = 'draft' | 'active' | 'terminated' | 'completed';
export type ContractBillingCycle = 'one_time' | 'monthly' | 'quarterly' | 'yearly';

export interface Contract {
  id: string;
  provider: string; // Dienstleister / Vermieter
  description?: string;
  amount: number;
  currency: string;
  billing_cycle: ContractBillingCycle;
  start_date?: string;
  end_date?: string;
  status: ContractStatus;
  category: string;
  assigned_event?: string;
  tags?: string[];
  created_at?: string;
}

export interface Event {
  id: string;
  name: string;
  date?: string;
  description?: string;
}
