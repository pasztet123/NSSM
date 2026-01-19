-- Add rotation column to models_3d table
ALTER TABLE models_3d 
ADD COLUMN IF NOT EXISTS rotation JSONB DEFAULT '[0, 0, 1.5707963267948966]'::jsonb;

-- Update existing models to have default rotation
UPDATE models_3d 
SET rotation = '[0, 0, 1.5707963267948966]'::jsonb 
WHERE rotation IS NULL;
