const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5001';

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.errors?.join(' ') || payload.message || 'Something went wrong.';
    throw new Error(message);
  }

  return payload;
};

export const api = {
  baseUrl: API_BASE_URL,

  authenticate: () => request('/api/auth/'),

  login: (email, password) => request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),

  signup: (username, email, password) => request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  }),

  logout: () => request('/api/auth/logout'),

  getMeds: () => request('/api/meds_list/active'),

  createMed: (med) => request('/api/meds_list/new', {
    method: 'POST',
    body: JSON.stringify(med),
  }),

  updateMed: (med) => request(`/api/meds_list/${med.id}/update`, {
    method: 'PUT',
    body: JSON.stringify(med),
  }),

  deleteMed: (id) => request(`/api/meds_list/${id}/delete`, {
    method: 'DELETE',
  }),

  getTasks: () => request('/api/tasks/all'),

  createTask: (task) => request('/api/tasks/new', {
    method: 'POST',
    body: JSON.stringify(task),
  }),

  updateTask: (task) => request(`/api/tasks/update/${task.id}/`, {
    method: 'PUT',
    body: JSON.stringify(task),
  }),

  deleteTask: (id) => request(`/api/tasks/${id}/delete`, {
    method: 'DELETE',
  }),

  getSupportState: () => request('/api/support_state/'),

  saveSupportState: (data) => request('/api/support_state/', {
    method: 'PUT',
    body: JSON.stringify({ data }),
  }),

  getCalendarFeed: () => request('/api/calendar/feed'),

  resetCalendarFeed: () => request('/api/calendar/feed/reset', {
    method: 'POST',
  }),
};
