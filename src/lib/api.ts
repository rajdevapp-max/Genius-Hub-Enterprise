import type { SearchRequest, SearchResponse, JDMatchRequest, JDMatchResponse, StatsResponse, UploadResponse, LiveStatus, Candidate } from './types';

// --- THE INFINITE DEMO ROUTER ---
const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
const demoBackend = params.get('demo'); // Grabs the company name from the URL

// If it's a demo link, point to the 0-resume demo backend. Otherwise, use the 37K Production backend!
const API_BASE = demoBackend 
  ? `https://vinu019-${demoBackend}.hf.space` 
  : (import.meta.env.VITE_API_URL || 'https://vinu019-resume-backend.hf.space');

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
  return res.json();
}

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
  search: (data: ExpandedSearchRequest) =>
    apiFetch<ExpandedSearchResponse>('/api/search', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 🎯 UPDATED: Now perfectly supports the new Location Filter for JD Match
  matchJD: (data: JDMatchRequest & { location?: string }) =>
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
    const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
  },

  uploadBatch: async (files: File[]): Promise<{ message: string; results: any[] }> => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    const res = await fetch(`${API_BASE}/api/upload-batch`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`Batch upload failed: ${res.status}`);
    return res.json();
  },

  // 🎯 UPDATED: Renamed to deleteResume and points to the highly secure backend physical file deletion endpoint!
  deleteResume: (id: number) =>
    apiFetch<{ message: string }>(`/api/resumes/${id}`, { method: 'DELETE' }),

  exportCSV: (ids?: number[]) =>
    `${API_BASE}/api/export${ids?.length ? `?ids=${ids.join(',')}` : ''}`,

  downloadResume: (filename: string) =>
    `${API_BASE}/api/resumes/${encodeURIComponent(filename)}`,
};