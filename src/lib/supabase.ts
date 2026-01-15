import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Model3DRecord {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  geometry_type: 'box' | 'cylinder' | 'lProfile' | 'tProfile' | 'custom' | 'uploaded';
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    radius?: number;
  };
  sketch_2d: {
    points: Array<{ id: string; x: number; y: number }>;
    segments: Array<{ id: string; startPointId: string; endPointId: string; length: number }>;
  };
  color?: string;
  file_path?: string; // Path in Supabase Storage
  file_type?: 'stl' | 'obj' | 'gltf' | 'glb';
  created_at: string;
  updated_at: string;
}
