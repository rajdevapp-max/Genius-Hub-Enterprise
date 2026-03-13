// Unified Candidate interface keeping ALL previous features + NEW deep analysis fields
export interface Candidate {
  id: number;
  name: string;
  email: string;
  phone?: string;
  location: string;
  education: string;
  experience_years: number;
  skills: string[];
  
  // Previous matching features (Preserved)
  matched_skills?: string[];
  missing_skills?: string[];
  context_snippets?: { skill: string; context: string; type: string }[];
  
  // New Priority matching features
  matched_mandatory?: string[];
  matched_secondary?: string[];
  missing_mandatory?: string[];
  
  summary: string;
  score: number;
  ats_score?: number;
  filename: string;
  certificates?: string[];
  hyperlinks?: string[];
  
  // Extracted Profiles
  linkedin?: string;
  github?: string;
  
  // Metadata & Analytics
  has_image?: boolean;
  page_count?: number;
  word_count?: number;
  font_info?: Record<string, { sizes: number[]; count: number }>;
  created_at?: string;
  match_type?: 'name' | 'semantic';

  // --- NEW INDUSTRY-READY FEATURES ---
  fraud_flag?: number;
  fraud_reason?: string;
  impact_score?: number;
  job_hopper?: boolean;     
  has_gap?: boolean;        
  fake_full_stack?: boolean; 
  open_source?: boolean;     
}

export interface SearchRequest {
  query: string;
  top_k?: number;
  min_score?: number;
  min_experience?: number;
  location?: string;
  education?: string;
  skills_filter?: string[];
  
  // Strict/Priority Filters
  mandatory_skills?: string[];
  secondary_skills?: string[];
  mandatory_location?: string;
  mandatory_education?: string;
  
  // Profile Toggles
  require_linkedin?: boolean;
  require_github?: boolean;
  require_leetcode?: boolean;
  require_hackerrank?: boolean;
  require_codechef?: boolean;
}

export interface SearchResponse {
  candidates: Candidate[];
  total_time: number;
  total_indexed: number;
  query_breakdown: Record<string, string | string[]>;
}

export interface JDMatchRequest {
  job_description: string;
  top_k?: number;
}

export interface JDMatchResponse {
  candidates: Candidate[];
  required_skills: string[];
  total_resumes: number;
  total_time: number;
}

export interface StatsResponse {
  total_resumes: number;
  avg_experience: number;
  avg_score: number;
  avg_word_count: number;
  avg_page_count: number;
  resumes_with_images: number;
  certificates_count: number;
  top_skills: { skill: string; count: number }[];
  experience_distribution: { range: string; count: number }[];
  location_distribution: { location: string; count: number }[];
  education_distribution: { education: string; count: number }[];
  score_distribution: { range: string; count: number }[];
  processing_status: {
    total_processed: number;
    last_event: string | null;
    processing: boolean;
  };
  fraud_count?: number;
  avg_impact_score?: number;
}

export interface LiveStatus {
  total_resumes: number;
  indexed: number;
  total_processed: number;
  last_event: string | null;
  processing: boolean;
}

export interface UploadResponse {
  message: string;
  data: Candidate;
}