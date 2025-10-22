export type UserRole = 'admin' | 'doctor' | 'user';

export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type SeverityLevel = 'healthy' | 'mild' | 'moderate' | 'severe';

export type FeedbackStatus = 'pending' | 'reviewed' | 'resolved';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  organization: string | null;
  created_at: string;
  updated_at: string;
}

export interface Analysis {
  id: string;
  user_id: string;
  patient_id: string | null;
  file_name: string;
  file_url: string;
  file_type: string;
  status: AnalysisStatus;
  severity: SeverityLevel | null;
  condition: string | null;
  confidence: number | null;
  total_frames: number | null;
  abnormal_frames: number | null;
  region_of_interest: string | null;
  device_model: string | null;
  notes: string | null;
  ai_insights: string[] | null;
  processing_time_seconds: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface AnalysisFrame {
  id: string;
  analysis_id: string;
  frame_number: number;
  timestamp_ms: number | null;
  is_abnormal: boolean;
  severity: SeverityLevel | null;
  confidence: number | null;
  detected_conditions: string[] | null;
  overlay_data: any;
  created_at: string;
}

export interface Feedback {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  organization: string | null;
  subject: string;
  message: string;
  attachment_url: string | null;
  status: FeedbackStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SystemMetrics {
  id: string;
  date: string;
  total_analyses: number;
  normal_cases: number;
  abnormal_cases: number;
  avg_confidence: number | null;
  avg_processing_time: number | null;
  active_users: number;
  created_at: string;
}
