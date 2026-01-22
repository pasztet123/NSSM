-- Drop the existing table and recreate with correct structure
DROP TABLE IF EXISTS flashing_products CASCADE;

-- Create flashing_products table with TEXT id for product IDs like "prod-1", "prod-2"
CREATE TABLE flashing_products (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_3d_rotation JSONB DEFAULT '[0, 0, 1.5707963267948966]',
  model_3d_color TEXT DEFAULT '#ffffff',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id, user_id)
);

-- Enable RLS
ALTER TABLE flashing_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own product settings"
  ON flashing_products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own product settings"
  ON flashing_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own product settings"
  ON flashing_products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own product settings"
  ON flashing_products FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_flashing_products_updated_at
    BEFORE UPDATE ON flashing_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
