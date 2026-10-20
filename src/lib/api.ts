// api.ts — Unified API Client Layer v30.0
// Features: Infinite Demo Routing, Vercel multi-project routing, and correct endpoint definitions.

import type { SearchRequest, SearchResponse, JDMatchRequest, JDMatchResponse, StatsResponse, UploadResponse, LiveStatus, Candidate } from './types';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export const AUTH_KEY = 'gh_auth_token';
export const getToken = () => sessionStorage.getItem(AUTH_KEY) || '';
const authHeaders = (): Record<string, string> => (getToken() ? { Authorization: `Bearer ${getToken()}` } : {});
const withToken = (url: string) => `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(getToken())}`;

const handleAuthFailure = (res: Response) => {
  if (res.status === 401 && !window.location.pathname.startsWith('/login')) {
    sessionStorage.removeItem(AUTH_KEY);
    window.location.href = '/login';
  }
};

const apiFetch = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options?.headers || {}),
    },
  });
  handleAuthFailure(res);
  if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
  return res.json();
};

export interface BrowseResponse {
  candidates: Candidate[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface Suggestions {
  names: string[];
  skills: string[];
  locations: string[];
}

export interface ExpandedSearchRequest extends SearchRequest {
  page?: number;
  per_page?: number;
  top_n?: number;
}

export interface ExpandedSearchResponse extends SearchResponse {
  total_matches: number;
  page: number;
  total_pages: number;
  per_page: number;
}

export const api = {
  login: async (username: string, password: string): Promise<{ token: string; username: string }> => {
    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error(res.status === 401 ? 'invalid' : `Login failed: ${res.status}`);
    return res.json();
  },

  search: (data: ExpandedSearchRequest) =>
    apiFetch<ExpandedSearchResponse>('/api/search', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 🎯 NEW: Accept key_skills parameter
  matchJD: (data: JDMatchRequest & { location?: string; key_skills?: string }) =>
    apiFetch<JDMatchResponse>('/api/match-jd', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getStats: () => apiFetch<StatsResponse>('/api/stats'),
  getLiveStatus: () => apiFetch<LiveStatus>('/api/live-status'),
  getCandidate: (id: number) => apiFetch<Candidate>(`/api/candidate/${id}`),

  browse: (params: { page?: number; per_page?: number; sort_by?: string; sort_order?: string; skill_filter?: string; location_filter?: string }) => {
    const p = new URLSearchParams();
    if (params.page) p.set('page', String(params.page));
    if (params.per_page) p.set('per_page', String(params.per_page));
    if (params.sort_by) p.set('sort_by', String(params.sort_by));
    if (params.sort_order) p.set('sort_order', String(params.sort_order));
    if (params.skill_filter) p.set('skill_filter', params.skill_filter);
    if (params.location_filter) p.set('location_filter', params.location_filter);
    return apiFetch<BrowseResponse>(`/api/browse?${p.toString()}`);
  },

  suggestions: (q: string) => apiFetch<Suggestions>(`/api/suggestions?q=${encodeURIComponent(q)}`),

  getDuplicates: () => apiFetch<{
    db_duplicates: any[];
    folder_duplicates: any[];
    total_duplicate_groups: number;
    total_duplicate_files: number;
  }>('/api/duplicates'),

  removeDuplicates: (dryRun: boolean = false) =>
    apiFetch<{ removed: number; groups: number; errors: number; dry_run: boolean }>(
      `/api/duplicates/remove?dry_run=${dryRun}`, { method: 'POST' }
    ),

  previewResume: (id: number) => apiFetch<{ id: number; name: string; filename: string; raw_text: string; score: number }>(`/api/preview/${id}`),

  uploadResume: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: formData, headers: authHeaders() });
    handleAuthFailure(res);
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
  },

  uploadBatch: async (files: File[]): Promise<{ message: string; results: any[] }> => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    const res = await fetch(`${API_URL}/api/upload-batch`, { method: 'POST', body: formData, headers: authHeaders() });
    handleAuthFailure(res);
    if (!res.ok) throw new Error(`Batch upload failed: ${res.status}`);
    return res.json();
  },

  deleteCandidate: (id: number) =>
    apiFetch<{ message: string }>(`/api/candidate/${id}/delete`, { method: 'POST' }),

  deleteResume: (id: number) =>
    apiFetch<{ message: string }>(`/api/candidate/${id}/delete`, { method: 'POST' }),

  deleteBatchResumes: async (ids: number[]) => {
    const res = await fetch(`${API_URL}/api/candidates/delete-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ ids })
    });
    if (!res.ok) throw new Error('Failed to delete batch');
    return res.json();
  },

  deleteAllResumes: async () => {
    const res = await fetch(`${API_URL}/api/candidates/delete-all`, { method: 'POST', headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to wipe database');
    return res.json();
  },

  exportCSV: (ids?: number[]) =>
    withToken(`${API_URL}/api/export${ids?.length ? `?ids=${ids.join(',')}` : ''}`),

  downloadResume: (filename: string) =>
    withToken(`${API_URL}/api/resumes/${encodeURIComponent(filename)}`),
};