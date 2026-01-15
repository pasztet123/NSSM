import { supabase } from './supabase';
import { Model3D, Point, Segment } from '../types';

/**
 * Upload 3D model file to Supabase Storage
 */
export async function upload3DModelFile(
  file: File,
  userId: string
): Promise<{ path: string; error: Error | null }> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { error } = await supabase.storage
      .from('3d-models')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    return { path: filePath, error: null };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { path: '', error: error as Error };
  }
}

/**
 * Get public URL for 3D model file
 */
export function get3DModelFileUrl(filePath: string): string {
  const { data } = supabase.storage.from('3d-models').getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Download 3D model file from Supabase Storage
 */
export async function download3DModelFile(
  filePath: string
): Promise<{ data: Blob | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.storage
      .from('3d-models')
      .download(filePath);

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error downloading file:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Delete 3D model file from Supabase Storage
 */
export async function delete3DModelFile(
  filePath: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.storage
      .from('3d-models')
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { error: error as Error };
  }
}

/**
 * Save 3D model metadata to database
 */
export async function save3DModel(model: Model3D): Promise<{ id: string | null; error: Error | null }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('models_3d')
      .insert({
        user_id: user.user.id,
        name: model.name,
        description: model.description,
        geometry_type: model.geometryType,
        dimensions: model.dimensions || {},
        sketch_2d: model.sketch2D,
        color: model.color,
        file_path: model.uploadedFile,
        file_type: model.fileType,
      })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return { id: data.id, error: null };
  } catch (error) {
    console.error('Error saving model:', error);
    return { id: null, error: error as Error };
  }
}

/**
 * Update existing 3D model
 */
export async function update3DModel(
  id: string,
  updates: Partial<Model3D>
): Promise<{ error: Error | null }> {
  try {
    const updateData: any = {};
    
    if (updates.name) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.geometryType) updateData.geometry_type = updates.geometryType;
    if (updates.dimensions) updateData.dimensions = updates.dimensions;
    if (updates.sketch2D) updateData.sketch_2d = updates.sketch2D;
    if (updates.color) updateData.color = updates.color;
    if (updates.uploadedFile) updateData.file_path = updates.uploadedFile;
    if (updates.fileType) updateData.file_type = updates.fileType;

    const { error } = await supabase
      .from('models_3d')
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Error updating model:', error);
    return { error: error as Error };
  }
}

/**
 * Get all 3D models for current user
 */
export async function get3DModels(): Promise<{ models: Model3D[]; error: Error | null }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('models_3d')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const models: Model3D[] = data.map((record: any) => ({
      id: record.id,
      name: record.name,
      description: record.description || '',
      geometryType: record.geometry_type,
      dimensions: record.dimensions,
      sketch2D: record.sketch_2d,
      color: record.color,
      uploadedFile: record.file_path,
      fileType: record.file_type,
    }));

    return { models, error: null };
  } catch (error) {
    console.error('Error fetching models:', error);
    return { models: [], error: error as Error };
  }
}

/**
 * Get single 3D model by ID
 */
export async function get3DModel(id: string): Promise<{ model: Model3D | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('models_3d')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    const model: Model3D = {
      id: data.id,
      name: data.name,
      description: data.description || '',
      geometryType: data.geometry_type,
      dimensions: data.dimensions,
      sketch2D: data.sketch_2d,
      color: data.color,
      uploadedFile: data.file_path,
      fileType: data.file_type,
    };

    return { model, error: null };
  } catch (error) {
    console.error('Error fetching model:', error);
    return { model: null, error: error as Error };
  }
}

/**
 * Delete 3D model (both database record and file)
 */
export async function delete3DModel(id: string): Promise<{ error: Error | null }> {
  try {
    // First get the model to know the file path
    const { data: model, error: fetchError } = await supabase
      .from('models_3d')
      .select('file_path')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Delete file from storage if it exists
    if (model.file_path) {
      await delete3DModelFile(model.file_path);
    }

    // Delete database record
    const { error } = await supabase
      .from('models_3d')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Error deleting model:', error);
    return { error: error as Error };
  }
}

/**
 * Save 2D sketch to database
 */
export async function save2DSketch(
  name: string,
  description: string,
  points: Point[],
  segments: Segment[],
  category?: string
): Promise<{ id: string | null; error: Error | null }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('sketches_2d')
      .insert({
        user_id: user.user.id,
        name,
        description,
        category: category || 'Custom',
        points,
        segments,
      })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return { id: data.id, error: null };
  } catch (error) {
    console.error('Error saving sketch:', error);
    return { id: null, error: error as Error };
  }
}

/**
 * Get all 2D sketches for current user
 */
export async function get2DSketches(): Promise<{ 
  sketches: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    thumbnail: string;
    sketch2D: { points: Point[]; segments: Segment[] };
  }>; 
  error: Error | null 
}> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('sketches_2d')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const sketches = data.map((record: any) => ({
      id: record.id,
      name: record.name,
      description: record.description || '',
      category: record.category || 'Custom',
      thumbnail: '✏️',
      sketch2D: {
        points: record.points,
        segments: record.segments,
      },
    }));

    return { sketches, error: null };
  } catch (error) {
    console.error('Error fetching sketches:', error);
    return { sketches: [], error: error as Error };
  }
}

/**
 * Delete 2D sketch from database
 */
export async function delete2DSketch(id: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('sketches_2d')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Error deleting sketch:', error);
    return { error: error as Error };
  }
}
