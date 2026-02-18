const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const CATEGORY_OPTIONS = ['billing', 'technical', 'account', 'general'];
export const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];
export const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed'];

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const error = new Error('Request failed');
    error.payload = body;
    throw error;
  }

  return body;
}

export async function fetchTickets(filters) {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);

  const query = params.toString();
  return request(`/tickets/${query ? `?${query}` : ''}`);
}

export async function createTicket(payload) {
  return request('/tickets/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function patchTicket(ticketId, payload) {
  return request(`/tickets/${ticketId}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function classifyDescription(description) {
  return request('/tickets/classify/', {
    method: 'POST',
    body: JSON.stringify({ description }),
  });
}

export async function fetchStats() {
  return request('/tickets/stats/');
}