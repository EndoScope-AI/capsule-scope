-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'doctor', 'user');

-- Create enum for analysis status
CREATE TYPE public.analysis_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Create enum for severity levels
CREATE TYPE public.severity_level AS ENUM ('healthy', 'mild', 'moderate', 'severe');

-- Create enum for feedback status
CREATE TYPE public.feedback_status AS ENUM ('pending', 'reviewed', 'resolved');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'user' NOT NULL,
  organization TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create analyses table
CREATE TABLE public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  patient_id TEXT,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  status analysis_status DEFAULT 'pending' NOT NULL,
  severity severity_level,
  condition TEXT,
  confidence DECIMAL(5,2),
  total_frames INTEGER,
  abnormal_frames INTEGER,
  region_of_interest TEXT,
  device_model TEXT,
  notes TEXT,
  ai_insights TEXT[],
  processing_time_seconds DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Create analysis_frames table
CREATE TABLE public.analysis_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE NOT NULL,
  frame_number INTEGER NOT NULL,
  timestamp_ms INTEGER,
  is_abnormal BOOLEAN DEFAULT false NOT NULL,
  severity severity_level,
  confidence DECIMAL(5,2),
  detected_conditions TEXT[],
  overlay_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create feedback table
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  attachment_url TEXT,
  status feedback_status DEFAULT 'pending' NOT NULL,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create system_metrics table for dashboard KPIs
CREATE TABLE public.system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE DEFAULT CURRENT_DATE NOT NULL UNIQUE,
  total_analyses INTEGER DEFAULT 0,
  normal_cases INTEGER DEFAULT 0,
  abnormal_cases INTEGER DEFAULT 0,
  avg_confidence DECIMAL(5,2),
  avg_processing_time DECIMAL(10,2),
  active_users INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for analyses
CREATE POLICY "Users can view their own analyses"
  ON public.analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses"
  ON public.analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses"
  ON public.analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all analyses"
  ON public.analyses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for analysis_frames
CREATE POLICY "Users can view frames from their analyses"
  ON public.analysis_frames FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.analyses
      WHERE analyses.id = analysis_frames.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert frames for their analyses"
  ON public.analysis_frames FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.analyses
      WHERE analyses.id = analysis_frames.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

-- RLS Policies for feedback
CREATE POLICY "Users can view their own feedback"
  ON public.feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
  ON public.feedback FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for system_metrics
CREATE POLICY "Everyone can view system metrics"
  ON public.system_metrics FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert metrics"
  ON public.system_metrics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update metrics"
  ON public.system_metrics FOR UPDATE
  USING (true);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('endoscopy-uploads', 'endoscopy-uploads', false, 524288000, ARRAY['video/mp4', 'video/avi', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp']),
  ('analysis-results', 'analysis-results', false, 52428800, ARRAY['image/jpeg', 'image/png', 'application/pdf']);

-- Storage policies for endoscopy-uploads
CREATE POLICY "Users can upload their own files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'endoscopy-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own uploads"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'endoscopy-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own uploads"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'endoscopy-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for analysis-results
CREATE POLICY "Users can view their analysis results"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'analysis-results' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "System can create analysis results"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'analysis-results');

-- Create indexes for performance
CREATE INDEX idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX idx_analyses_status ON public.analyses(status);
CREATE INDEX idx_analyses_created_at ON public.analyses(created_at DESC);
CREATE INDEX idx_analysis_frames_analysis_id ON public.analysis_frames(analysis_id);
CREATE INDEX idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX idx_feedback_status ON public.feedback(status);
CREATE INDEX idx_system_metrics_date ON public.system_metrics(date DESC);