"""
api.ts — Unified API Client Layer v30.0
Features: Infinite Demo Routing, Vercel multi-project routing, 
and correct endpoint definitions.
"""
import type { SearchRequest, SearchResponse, JDMatchRequest, JDMatchResponse, StatsResponse, UploadResponse, LiveStatus, Candidate } from './types';

// --- THE INFINITE DEMO ROUTER ---
// 1. First, check if this is a Vercel-specific project URL (like genius-hub-client.vercel.app)
const VERCEL_PROJECT_URL = import.meta.env.VITE_VERCEL_URL;
let API_URL: string;

if (VERCEL_PROJECT_URL && VERCEL_PROJECT_URL.includes('vercel.app')) {
  const parts = VERCEL_PROJECT_URL.split('.vercel.app')[0].split('-');
  const companyName = parts[parts.length - 1]; // e.g., 'genius'
  // Point to the dedicated backend Space for this client project
  API_URL = `https://vinu019-${companyName}.hf.space`;
} else {
  // 2. Fallback to reading 'demo' from the URL query param for generic projects (like resume-bats.vercel.app)
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const demoBackend = params.get('demo'); // e.g., 'genius' or 'tesla'

  // If it's a demo link, point to the dedicated demo Space. Otherwise, use the standard Production backend.
  API_URL = demoBackend 
    ? `https://vinu019-${demoBackend}.hf.space` 
    : (import.meta.env.VITE_API_URL || 'https://vinu019-resume-backend.hf.space');
}

// Global configuration is complete.

const apiFetch = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
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
  search: (data: ExpandedSearchRequest) =>
    apiFetch<ExpandedSearchResponse>('/api/search', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // MODIFIED: Updated matchJD function to accept location for correct matching logic
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

  // MODIFIED: Changed route from POST /api/resumes to POST /api/duplicates/remove for safety
  removeDuplicates: (dryRun: boolean = false) =>
    apiFetch<{ removed: number; groups: number; errors: number; dry_run: boolean }>(
      `/api/duplicates/remove?dry_run=${dryRun}`, { method: 'POST' }
    ),

  previewResume: (id: number) => apiFetch<{ id: number; name: string; filename: string; raw_text: string; score: number }>(`/api/preview/${id}`),

  uploadResume: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    return res.json();
  },

  uploadBatch: async (files: File[]): Promise<{ message: string; results: any[] }> => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    const res = await fetch(`${API_URL}/api/upload-batch`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`Batch upload failed: ${res.status}`);
    return res.json();
  },
};