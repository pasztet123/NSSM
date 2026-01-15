import { useState, useRef } from 'react';
import { Model3D } from '../types';
import { supabase } from '../lib/supabase';
import { upload3DModelFile, save3DModel } from '../lib/storage';
import './ModelUploader.css';

interface SimpleModelUploaderProps {
  onModelUploaded: (model: Model3D) => void;
  onClose: () => void;
}

const SimpleModelUploader = ({ onModelUploaded, onClose }: SimpleModelUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('=== FILE SELECTED ===');
    console.log('Name:', file.name);
    console.log('Size:', file.size);
    console.log('Type:', file.type);

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!['stl', 'obj', 'gltf', 'glb'].includes(fileExt || '')) {
      alert('Unsupported file format. Please upload .stl, .obj, .gltf, or .glb files.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      alert('File too large! Maximum size is 50MB.');
      return;
    }

    setUploading(true);

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      console.log('User authenticated:', !!user);

      const modelName = file.name.replace(/\.[^/.]+$/, '');
      
      if (user) {
        // Upload to Supabase Storage
        console.log('Uploading to Supabase Storage...');
        const { path, error: uploadError } = await upload3DModelFile(file, user.id);
        
        if (uploadError) {
          throw uploadError;
        }
        
        console.log('File uploaded to:', path);

        // Create model object with Supabase path
        const newModel: Model3D = {
          id: `temp-${Date.now()}`,
          name: modelName,
          description: `Uploaded ${fileExt.toUpperCase()} model`,
          geometryType: 'uploaded',
          uploadedFile: path,
          fileType: fileExt as 'stl' | 'obj' | 'gltf' | 'glb',
          color: '#e67e22',
          sketch2D: {
            points: [],
            segments: [],
          },
        };

        // Save metadata to database
        console.log('Saving metadata to database...');
        const { id, error: saveError } = await save3DModel(newModel);
        
        if (saveError) {
          throw saveError;
        }

        newModel.id = id || newModel.id;
        console.log('Model saved with ID:', newModel.id);
        
        onModelUploaded(newModel);
        onClose();
      } else {
        // Not logged in - use base64 and localStorage
        console.log('Not logged in, using localStorage...');
        alert('You must be logged in to upload models. Saving locally for now.');
        
        console.log('Reading file as ArrayBuffer...');
        const arrayBuffer = await file.arrayBuffer();
        console.log('ArrayBuffer size:', arrayBuffer.byteLength);

        // Convert to base64
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
          binary += String.fromCharCode.apply(null, Array.from(chunk));
        }
        const base64 = btoa(binary);
        const dataUrl = `data:application/octet-stream;base64,${base64}`;
        
        console.log('Base64 length:', base64.length);

        const newModel: Model3D = {
          id: `uploaded-${Date.now()}`,
          name: modelName,
          description: `Uploaded ${fileExt.toUpperCase()} model`,
          geometryType: 'uploaded',
          uploadedFile: dataUrl,
          fileType: fileExt as 'stl' | 'obj' | 'gltf' | 'glb',
          color: '#e67e22',
          sketch2D: {
            points: [],
            segments: [],
          },
        };

        console.log('=== MODEL CREATED (LOCAL) ===');
        console.log('ID:', newModel.id);
        
        onModelUploaded(newModel);
        onClose();
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload: ${error}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="model-uploader-overlay">
      <div className="model-uploader">
        <div className="uploader-header">
          <h2>Upload 3D Model</h2>
          <button className="close-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="uploader-content">
          <div className="upload-section">
            <p className="upload-description">
              Upload your 3D model file. Supported formats: .stl, .obj, .gltf, .glb (max 50MB)
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".stl,.obj,.gltf,.glb"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              disabled={uploading}
            />

            <button
              className="select-file-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="17 8 12 3 7 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="3" x2="12" y2="15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {uploading ? 'Uploading...' : 'Select File'}
            </button>
          </div>
        </div>

        <div className="uploader-footer">
          <button className="cancel-button" onClick={onClose} disabled={uploading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleModelUploader;
