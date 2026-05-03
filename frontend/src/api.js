import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const register  = (data) => API.post('/auth/register', data);
export const login     = (data) => API.post('/auth/login', data);
export const getMe     = ()     => API.get('/auth/me');

export const getProjects    = ()           => API.get('/projects');
export const getProject     = (id)         => API.get(`/projects/${id}`);
export const createProject  = (data)       => API.post('/projects', data);
export const addMember      = (id, data)   => API.post(`/projects/${id}/members`, data);
export const removeMember   = (id, uid)    => API.delete(`/projects/${id}/members/${uid}`);
export const deleteProject  = (id)         => API.delete(`/projects/${id}`);

export const getTasks    = (projectId)     => API.get(`/tasks/project/${projectId}`);
export const getStats    = (projectId)     => API.get(`/tasks/stats/${projectId}`);
export const createTask  = (data)          => API.post('/tasks', data);
export const updateTask  = (id, data)      => API.put(`/tasks/${id}`, data);
export const deleteTask  = (id)            => API.delete(`/tasks/${id}`);
