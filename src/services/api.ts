import axios from 'axios';
import type { ContextCard, ContextCase, ExportLog, ImportLog } from '../types';

const BASE = '/api';

function now() {
  return new Date().toISOString();
}

// ContextCard CRUD
export const cardsApi = {
  list: () =>
    axios.get<ContextCard[]>(`${BASE}/cards`).then((r) => r.data),

  get: (id: string) =>
    axios.get<ContextCard>(`${BASE}/cards/${id}`).then((r) => r.data),

  create: (data: Omit<ContextCard, 'id' | 'createdAt' | 'updatedAt'>) =>
    axios
      .post<ContextCard>(`${BASE}/cards`, { ...data, createdAt: now(), updatedAt: now() })
      .then((r) => r.data),

  update: (id: string, data: Partial<ContextCard>) =>
    axios
      .patch<ContextCard>(`${BASE}/cards/${id}`, { ...data, updatedAt: now() })
      .then((r) => r.data),

  delete: (id: string) =>
    axios.delete(`${BASE}/cards/${id}`).then((r) => r.data),
};

// ContextCase CRUD
export const casesApi = {
  list: () =>
    axios.get<ContextCase[]>(`${BASE}/cases`).then((r) => r.data),

  get: (id: string) =>
    axios.get<ContextCase>(`${BASE}/cases/${id}`).then((r) => r.data),

  create: (data: Omit<ContextCase, 'id' | 'createdAt' | 'updatedAt'>) =>
    axios
      .post<ContextCase>(`${BASE}/cases`, { ...data, createdAt: now(), updatedAt: now() })
      .then((r) => r.data),

  update: (id: string, data: Partial<ContextCase>) =>
    axios
      .patch<ContextCase>(`${BASE}/cases/${id}`, { ...data, updatedAt: now() })
      .then((r) => r.data),

  delete: (id: string) =>
    axios.delete(`${BASE}/cases/${id}`).then((r) => r.data),
};

// ExportLog
export const exportsApi = {
  list: () =>
    axios.get<ExportLog[]>(`${BASE}/exports`).then((r) => r.data),

  create: (data: Omit<ExportLog, 'id'>) =>
    axios
      .post<ExportLog>(`${BASE}/exports`, data)
      .then((r) => r.data),
};

// ImportLog
export const importLogsApi = {
  list: () =>
    axios.get<ImportLog[]>(`${BASE}/importLogs`).then((r) => r.data),

  listByCard: (cardId: string | number) =>
    axios
      .get<ImportLog[]>(`${BASE}/importLogs?targetCardId=${cardId}`)
      .then((r) => r.data),

  create: (data: Omit<ImportLog, 'id'>) =>
    axios
      .post<ImportLog>(`${BASE}/importLogs`, data)
      .then((r) => r.data),
};
