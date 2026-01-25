
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    
    // DEVELOPMENT: If running locally, force connection to Python backend on port 8000 via HTTP
    // This avoids issues where frontend is HTTPS (some local servers) but backend is HTTP,
    // or if the port detection logic fails.
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://${hostname}:8000`;
    }

    // PRODUCTION / CLOUD IDE: Assume backend is served from the same origin (relative path)
    // or via a proxy rule (e.g., /api -> backend).
    return ''; 
  }
  return 'http://localhost:8000';
};

const BASE_URL = getBaseUrl();

const storage = {
  get: (key: string) => JSON.parse(localStorage.getItem(`wya_v3_${key}`) || 'null'),
  set: (key: string, val: any) => localStorage.setItem(`wya_v3_${key}`, JSON.stringify(val)),
};

const getAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem('wya_token');
  const headers: Record<string, string> = {};
  if (token && token !== 'null' && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isFormData) headers['Content-Type'] = 'application/json';
  return headers;
};

const handleResponse = async (response: Response, defaultError: string) => {
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('wya_token');
      localStorage.removeItem('wya_v3_user');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    let errorMessage = defaultError;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || defaultError;
    } catch (e) {}
    throw new Error(errorMessage);
  }
  return response.json();
};

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(options.body instanceof FormData),
        ...(options.headers || {})
      }
    });
    return await handleResponse(response, `Request to ${endpoint} failed`);
  } catch (err) {
    console.warn(`API Error (${endpoint}):`, err);
    throw new Error(err instanceof TypeError && err.message === 'Failed to fetch' 
      ? 'Unable to connect to server. Ensure the backend is running on port 8000.' 
      : (err as Error).message);
  }
};

export const api = {
  auth: {
    login: async (credentials: any) => {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (data.access_token) {
        localStorage.setItem('wya_token', data.access_token);
        storage.set('user', data.user);
      }
      return data;
    },
    register: async (userData: any) => {
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (data.access_token) {
        localStorage.setItem('wya_token', data.access_token);
        storage.set('user', data.user);
      }
      return data;
    },
    logout: () => {
      localStorage.removeItem('wya_token');
      localStorage.removeItem('wya_v3_user');
      window.location.href = '/';
    }
  },
  dashboard: {
    getStats: async () => apiFetch('/api/dashboard/stats', {}),
  },
  wardrobe: {
    getAll: async () => apiFetch('/api/wardrobe', {}),
    add: async (formData: FormData) => apiFetch('/api/wardrobe', { method: 'POST', body: formData }),
    update: async (id: string, formData: FormData) => apiFetch(`/api/wardrobe/${id}`, { method: 'PUT', body: formData }),
    delete: async (id: string) => apiFetch(`/api/wardrobe/${id}`, { method: 'DELETE' }),
    wear: async (id: string) => apiFetch(`/api/wardrobe/${id}/wear`, { method: 'POST' }),
    
    // AI Endpoints
    scanFabric: async (image: string) => apiFetch('/api/ai/fabric-scan', {
      method: 'POST',
      body: JSON.stringify({ image })
    }),
    outfitMatch: async (image: string, variation: number = 0) => apiFetch('/api/ai/outfit-match', {
      method: 'POST',
      body: JSON.stringify({ image, variation })
    }),
  },
  ai: {
    getWeather: async (city: string) => apiFetch('/api/ai/weather-search', {
      method: 'POST',
      body: JSON.stringify({ city })
    }),
    getGreenAudit: async (brand: string) => apiFetch('/api/ai/green-audit', {
      method: 'POST',
      body: JSON.stringify({ brand })
    }),
    getVacationPlan: async (type: string, days: number, city: string) => apiFetch(`/api/ai/vacation-packer?vacation_type=${type}&duration_days=${days}&city=${encodeURIComponent(city)}`, {}),
    curateOutfits: async (items: any[]) => apiFetch('/api/ai/curate-outfits', {
      method: 'POST',
      body: JSON.stringify({ items })
    }),
  },
  profile: {
    get: async () => apiFetch('/api/user/profile', {}),
    update: async (data: any) => apiFetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    getPreferences: async () => apiFetch('/api/user/preferences', {}),
    updatePreferences: async (data: any) => apiFetch('/api/user/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
    getActivity: async () => apiFetch('/api/user/activity', {}),
  },
  style: {
    getDNA: async (user_id: string) => apiFetch(`/api/style/dna/${user_id}`, {}),
    saveDNA: async (dnaData: any) => apiFetch('/api/style/dna', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dnaData),
    }),
    getEvolution: async () => apiFetch('/api/style/evolution', {}),
  }
};
