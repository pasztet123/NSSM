import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Model3D } from '../types';
import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';
import { download3DModelFile } from '../lib/storage';
import './ModelViewer3D.css';

interface SimpleModelViewerProps {
  model: Model3D;
}

const UploadedModel = ({ model }: { model: Model3D }) => {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('=== LOADING MODEL ===');
    console.log('Name:', model.name);
    console.log('Type:', model.fileType);
    console.log('GeometryType:', model.geometryType);
    console.log('uploadedFile exists:', !!model.uploadedFile);
    console.log('uploadedFile:', model.uploadedFile?.substring(0, 100));

    if (!model.uploadedFile) {
      console.error('No uploadedFile!');
      setError('No file data');
      return;
    }

    const loadSTL = async () => {
      try {
        let arrayBuffer: ArrayBuffer;
        const uploadedFile = model.uploadedFile!; // Safe after null check above

        // Check if it's a Supabase path or base64
        if (uploadedFile.startsWith('data:')) {
          // Base64 data (local mode)
          console.log('Loading from base64...');
          const base64Data = uploadedFile.includes(',') 
            ? uploadedFile.split(',')[1] 
            : uploadedFile;
          
          console.log('Base64 data length:', base64Data.length);

          if (!base64Data) {
            throw new Error('No base64 data found');
          }

          // Decode to ArrayBuffer
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          arrayBuffer = bytes.buffer;
        } else {
          // Supabase storage path
          console.log('Downloading from Supabase:', uploadedFile);
          const { data, error: downloadError } = await download3DModelFile(uploadedFile);
          
          if (downloadError || !data) {
            throw new Error(`Failed to download: ${downloadError?.message}`);
          }
          
          arrayBuffer = await data.arrayBuffer();
          console.log('Downloaded from Supabase, size:', arrayBuffer.byteLength);
        }
        
        console.log('ArrayBuffer size:', arrayBuffer.byteLength);

        // Check first bytes
        const view = new DataView(arrayBuffer);
        const first20 = new Uint8Array(arrayBuffer.slice(0, 20));
        console.log('First 20 bytes:', Array.from(first20).map(b => b.toString(16).padStart(2, '0')).join(' '));

        // Read triangle count
        const triangleCount = view.getUint32(80, true);
        console.log('Triangle count from header:', triangleCount);

        if (triangleCount > 10000000) {
          throw new Error(`Invalid triangle count: ${triangleCount}`);
        }

        // Parse STL
        const loader = new STLLoader();
        const geo = loader.parse(arrayBuffer);
        
        console.log('✓ STL parsed!');
        console.log('Vertices:', geo.attributes.position.count);

        geo.computeVertexNormals();
        geo.computeBoundingBox();
        geo.center();

        const bbox = geo.boundingBox;
        if (bbox) {
          const size = new THREE.Vector3();
          bbox.getSize(size);
          console.log('Bounding box:', size.x, size.y, size.z);

          const maxDim = Math.max(size.x, size.y, size.z);
          console.log('Max dimension:', maxDim);

          // Scale if needed
          if (maxDim < 1) {
            console.log('Scaling up by 10x');
            geo.scale(10, 10, 10);
          } else if (maxDim > 100) {
            const scale = 50 / maxDim;
            console.log('Scaling down by', scale);
            geo.scale(scale, scale, scale);
          }
        }

        setGeometry(geo);
      } catch (err) {
        console.error('❌ Load error:', err);
        setError(String(err));
      }
    };

    loadSTL();
  }, [model]);

  if (error) {
    console.error('=== ERROR STATE ===');
    console.error('Error:', error);
    return (
      <mesh>
        <boxGeometry args={[5, 5, 5]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>
    );
  }

  if (!geometry) {
    console.log('=== LOADING STATE ===');
    return (
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#666666" wireframe />
      </mesh>
    );
  }

  console.log('=== SUCCESS STATE ===');
  console.log('Rendering geometry with', geometry.attributes.position.count, 'vertices');
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial 
        color={model.color || '#e67e22'} 
        metalness={0.7} 
        roughness={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

const SimpleModelViewer = ({ model }: SimpleModelViewerProps) => {
  console.log('=== VIEWER RENDER ===');
  console.log('Model:', model);

  if (!model) {
    return (
      <div className="model-viewer-3d">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>
          No model selected
        </div>
      </div>
    );
  }

  if (model.geometryType !== 'uploaded') {
    return (
      <div className="model-viewer-3d">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>
          Only uploaded models supported in SimpleViewer
        </div>
      </div>
    );
  }

  return (
    <div className="model-viewer-3d">
      <Canvas shadows gl={{ antialias: true }} dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[15, 15, 15]} />
        <OrbitControls enablePan enableZoom enableRotate />

        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        <UploadedModel model={model} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#95a5a6" />
        </mesh>

        <gridHelper args={[50, 50, '#bdc3c7', '#ecf0f1']} position={[0, -4.99, 0]} />
      </Canvas>
      
      <div className="viewer-controls">
        <p>🖱️ Left click + drag to rotate | Scroll to zoom | Right click + drag to pan</p>
      </div>
    </div>
  );
};

export default SimpleModelViewer;
