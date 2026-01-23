
import { Subscription, SubscriptionStatus } from '../types';

const STORAGE_KEY = 'saasstack_subscriptions';

const DEFAULT_DATA: Subscription[] = [
  {
    id: '1',
    name: 'Slack',
    category: 'Kommunikation',
    description: 'Team-Messaging und Zusammenarbeit.',
    monthlyCost: 150,
    yearlyCost: 1800,
    renewalDate: '2025-05-15',
    status: SubscriptionStatus.ACTIVE,
    addedBy: 'Admin',
    // Added missing owner property
    owner: 'IT Operations',
    url: 'https://slack.com'
  },
  {
    id: '2',
    name: 'GitHub',
    category: 'Entwicklung',
    description: 'Versionsverwaltung und CI/CD.',
    monthlyCost: 200,
    yearlyCost: 2400,
    renewalDate: '2025-03-20',
    status: SubscriptionStatus.ACTIVE,
    addedBy: 'Engineering',
    // Added missing owner property
    owner: 'CTO Office',
    url: 'https://github.com'
  },
  {
    id: '3',
    name: 'Zoom',
    category: 'Kommunikation',
    description: 'Videokonferenzen.',
    monthlyCost: 45,
    yearlyCost: 540,
    renewalDate: '2025-02-28',
    status: SubscriptionStatus.ACTIVE,
    addedBy: 'Operations',
    // Added missing owner property
    owner: 'Facility Management',
    url: 'https://zoom.us'
  },
  {
    id: '4',
    name: 'Figma',
    category: 'Design',
    description: 'Kollaboratives Interface-Design.',
    monthlyCost: 75,
    yearlyCost: 900,
    renewalDate: '2025-08-10',
    status: SubscriptionStatus.ACTIVE,
    addedBy: 'Design Team',
    // Added missing owner property
    owner: 'Lead Designer',
    url: 'https://figma.com'
  }
];

export const getSubscriptions = (): Subscription[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    saveSubscriptions(DEFAULT_DATA);
    return DEFAULT_DATA;
  }
  return JSON.parse(data);
};

export const saveSubscriptions = (subs: Subscription[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
};

export const addSubscription = (sub: Omit<Subscription, 'id'>): Subscription => {
  const subs = getSubscriptions();
  const newSub = { ...sub, id: Math.random().toString(36).substr(2, 9) };
  saveSubscriptions([...subs, newSub]);
  return newSub;
};

export const deleteSubscription = (id: string): void => {
  const subs = getSubscriptions();
  saveSubscriptions(subs.filter(s => s.id !== id));
};
