ALTER TABLE public.uebungen
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS dauer INTEGER,
  ADD COLUMN IF NOT EXISTS tips JSONB;

CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak INTEGER NOT NULL DEFAULT 0,
  beste_streak INTEGER NOT NULL DEFAULT 0,
  letzter_tag DATE,
  taegliches_ziel INTEGER NOT NULL DEFAULT 1,
  heute_gemacht INTEGER NOT NULL DEFAULT 0,
  ziel_datum DATE,
  challenge_datum DATE,
  challenge_text TEXT,
  badges JSONB NOT NULL DEFAULT '[]'::jsonb,
  schwaechen JSONB,
  trainingsplan JSONB,
  module_abgeschlossen JSONB NOT NULL DEFAULT '[]'::jsonb,
  beste_bewertung INTEGER,
  anzahl_bestanden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_stats TO authenticated;
GRANT ALL ON public.user_stats TO service_role;

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own stats" ON public.user_stats;
CREATE POLICY "Users manage own stats" ON public.user_stats
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);