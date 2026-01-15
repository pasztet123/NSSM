import { useState, useRef } from 'react';
import { Model3D } from '../types';
import { supabase } from '../lib/supabase';
import { upload3DModelFile, save3DModel } from '../lib/storage';
import './ModelUploader.css';

interface ModelUploaderProps {
  onModelUploaded: (model: Model3D) => void;
  onClose: () => void;
}

// Helper function to read file as base64 (use ArrayBuffer for binary files)
const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      // Convert ArrayBuffer to base64 properly
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 0x8000; // 32KB chunks
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      const base64 = btoa(binary);
      
      // Add data URL prefix for compatibility
      const mimeType = file.type || 'application/octet-stream';
      resolve(`data:${mimeType};base64,${base64}`);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file); // Changed from readAsDataURL
  });
};

const ModelUploader = ({ onModelUploaded, onClose }: ModelUploaderProps) => {
  const [fileName, setFileName] = useState<string>('');
  const [modelName, setModelName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'stl' | 'obj' | 'gltf' | 'glb' | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['stl', 'obj', 'gltf', 'glb'].includes(fileExt || '')) {
      alert('Unsupported file format. Please upload .stl, .obj, .gltf, or .glb files.');
      return;
    }

    // Check file size (limit to 200MB for base64 encoding)
    const maxSize = 200 * 1024 * 1024; // 200MB
    if (selectedFile.size > maxSize) {
      alert('File too large! Maximum size is 200MB. Please use a smaller model or simplify your mesh.');
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setModelName(selectedFile.name.replace(/\.[^/.]+$/, ''));
    setFileType(fileExt as 'stl' | 'obj' | 'gltf' | 'glb');
  };

  const handleUpload = async () => {
    if (!file || !fileType || !modelName.trim()) {
      alert('Please select a file and provide a name for the model.');
      return;
    }

    console.log('=== STARTING UPLOAD ===');
    console.log('File:', file.name, 'Size:', file.size, 'Type:', fileType);
    setUploading(true);

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      console.log('User authenticated:', !!user);
      
      if (!user) {
        alert('You must be logged in to upload models. Saving locally for now.');
        
        console.log('Reading file as base64...');
        // Read file as base64 for local storage
        const base64File = await readFileAsBase64(file);
        console.log('Base64 encoded, length:', base64File.length);
        
        // Fallback: save locally without Supabase
        const newModel: Model3D = {
          id: `uploaded-${Date.now()}`,
          name: modelName.trim(),
          description: description.trim() || `Uploaded ${fileType.toUpperCase()} model`,
          geometryType: 'uploaded',
          uploadedFile: base64File,
          fileType: fileType,
          color: '#e67e22',
          sketch2D: {
            points: [],
            segments: [],
          },
        };
        
        console.log('Created model object:', newModel);
        console.log('Calling onModelUploaded...');
        onModelUploaded(newModel);
        console.log('Closing uploader...');
        onClose();
        return;
      }

      // Upload file to Supabase Storage
      const { path, error: uploadError } = await upload3DModelFile(file, user.id);
      
      if (uploadError) {
        throw uploadError;
      }

      // Create model object
      const newModel: Model3D = {
        id: `temp-${Date.now()}`,
        name: modelName.trim(),
        description: description.trim() || `Uploaded ${fileType.toUpperCase()} model`,
        geometryType: 'uploaded',
        uploadedFile: path,
        fileType: fileType,
        color: '#e67e22',
        sketch2D: {
          points: [],
          segments: [],
        },
      };

      // Save model metadata to database
      const { id, error: saveError } = await save3DModel(newModel);
      
      if (saveError) {
        throw saveError;
      }

      // Update model with actual ID from database
      newModel.id = id || newModel.id;

      onModelUploaded(newModel);
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload model: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
              Upload your 3D model file. Supported formats: .stl, .obj, .gltf, .glb
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".stl,.obj,.gltf,.glb"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            <button
              className="select-file-button"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="17 8 12 3 7 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="3" x2="12" y2="15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {fileName || 'Select File'}
            </button>

            {fileName && (
              <div className="file-info">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="13 2 13 9 20 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {fileName}
              </div>
            )}
          </div>

          <div className="form-section">
            <div className="form-group">
              <label>Model Name *</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="Enter model name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter model description (optional)"
                className="form-textarea"
                rows={3}
              />
            </div>

            <div className="info-box">
              <strong>Note:</strong> After uploading, you can draw a 2D sketch on the canvas to associate with this model.
            </div>
          </div>
        </div>

        <div className="uploader-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="upload-button"
            onClick={handleUpload}
            disabled={!file || !modelName.trim() || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Model'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelUploader;
