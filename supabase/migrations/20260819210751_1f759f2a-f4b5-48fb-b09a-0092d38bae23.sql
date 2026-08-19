CREATE TABLE public.uebungen (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thema_id TEXT NOT NULL,
  titel TEXT NOT NULL,
  datum TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  score INTEGER,
  bewertung JSONB,
  audio_pfad TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.uebungen TO authenticated;
GRANT ALL ON public.uebungen TO service_role;

ALTER TABLE public.uebungen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own uebungen" ON public.uebungen FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own uebungen" ON public.uebungen FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own uebungen" ON public.uebungen FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own uebungen" ON public.uebungen FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX uebungen_user_datum_idx ON public.uebungen (user_id, datum DESC);

CREATE POLICY "Users can read own recordings" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'aufnahmen' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload own recordings" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'aufnahmen' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own recordings" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'aufnahmen' AND auth.uid()::text = (storage.foldername(name))[1]);