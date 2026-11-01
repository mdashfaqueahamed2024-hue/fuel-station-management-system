const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('petroflow_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const stationId = localStorage.getItem('petroflow_station_id');
  if (stationId) {
    headers['x-station-id'] = stationId;
  }
  return headers;
};

export const api = {
  async get(endpoint, params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';

    const res = await fetch(`${BASE_URL}${endpoint}${queryString}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async post(endpoint, data = {}) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async patch(endpoint, data = {}) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async delete(endpoint) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async downloadCSV(endpoint, filename = 'export.csv') {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to download CSV export');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

async function handleResponse(res) {
  if (res.status === 401) {
    localStorage.removeItem('petroflow_token');
    localStorage.removeItem('petroflow_user');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMessage = json.message || json.errors?.[0]?.message || 'Request failed';
    throw new Error(errorMessage);
  }
  return json;
}
