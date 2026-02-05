const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation', // Ask for the inserted/updated record back
};

interface RequestOptions extends RequestInit {
  body?: any; // Allow object body for JSON stringification
}

const request = async <T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
  const url = `${SUPABASE_URL}/rest/v1${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      ...HEADERS,
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    // Try to parse JSON, but handle empty responses (like 204 No Content, though we ask for representation)
    const text = await response.text();
    return text ? JSON.parse(text) : (null as unknown as T);
  } catch (error) {
    console.error(`API Call Failed [${endpoint}]:`, error);
    throw error;
  }
};

export const apiClient = {
  get: <T>(endpoint: string, query?: string) =>
    request<T>(`${endpoint}${query ? `?${query}` : ''}`, { method: 'GET' }),

  post: <T>(endpoint: string, data: any) => request<T>(endpoint, { method: 'POST', body: data }),

  patch: <T>(endpoint: string, data: any) => request<T>(endpoint, { method: 'PATCH', body: data }),

  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
