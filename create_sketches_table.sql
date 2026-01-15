-- Create sketches_2d table
CREATE TABLE IF NOT EXISTS public.sketches_2d (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'Custom',
    points JSONB NOT NULL,
    segments JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sketches_2d ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own sketches"
    ON public.sketches_2d FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sketches"
    ON public.sketches_2d FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sketches"
    ON public.sketches_2d FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sketches"
    ON public.sketches_2d FOR DELETE
    USING (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_sketches_user_id ON public.sketches_2d(user_id);
