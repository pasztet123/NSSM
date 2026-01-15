import { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Center } from '@react-three/drei';
import { Model3D } from '../types';
import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';
import { OBJLoader } from 'three-stdlib';
import { GLTFLoader } from 'three-stdlib';
import './ModelViewer3D.css';

interface ModelViewer3DProps {
  model: Model3D;
}

const UploadedModel = ({ model }: { model: Model3D }) => {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!model.uploadedFile) {
      setError('No file data');
      setLoading(false);
      return;
    }

    const loadModel = async () => {
      try {
        console.log('Loading uploaded model:', model.name, 'Type:', model.fileType);
        
        let fileData: ArrayBuffer;
        const uploadedFile = model.uploadedFile!; // Safe after null check above
        
        // Check if it's base64 data or Supabase path
        if (uploadedFile.startsWith('data:') || uploadedFile.length > 1000) {
          // It's base64 encoded data (local upload)
          console.log('Loading from base64');
          console.log('uploadedFile length:', uploadedFile.length);
          console.log('uploadedFile prefix:', uploadedFile.substring(0, 50));
          
          // Extract base64 data (remove data URL prefix if present)
          const base64Data = uploadedFile.includes(',') 
            ? uploadedFile.split(',')[1] 
            : uploadedFile;
          
          console.log('base64Data length:', base64Data.length);
          console.log('base64Data prefix:', base64Data.substring(0, 50));
          
          if (!base64Data) {
            throw new Error('No base64 data found');
          }
          
          // Decode base64 to binary
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          fileData = bytes.buffer;
          console.log('Decoded to ArrayBuffer, size:', fileData.byteLength, 'bytes');
          
          // Debug: show first 100 bytes as hex
          const debugBytes = new Uint8Array(fileData.slice(0, 100));
          const hexStr = Array.from(debugBytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
          console.log('First 100 bytes (hex):', hexStr);
          
          // Debug: try to read as text to see if it's ASCII
          const textDecoder = new TextDecoder('utf-8', { fatal: false });
          const textPreview = textDecoder.decode(fileData.slice(0, 100));
          console.log('First 100 bytes (text):', textPreview);
        } else {
          // It's a Supabase storage path - need to download
          console.log('Loading from Supabase path:', uploadedFile);
          const response = await fetch(`/api/download-model?path=${encodeURIComponent(uploadedFile)}`);
          if (!response.ok) {
            throw new Error('Failed to download model from storage');
          }
          fileData = await response.arrayBuffer();
        }
        
        let loadedGeometry: THREE.BufferGeometry | null = null;

        if (model.fileType === 'stl') {
          const loader = new STLLoader();
          try {
            console.log('Parsing STL, buffer size:', fileData.byteLength);
            
            // Check if it's ASCII or Binary STL
            const view = new DataView(fileData);
            const isASCII = fileData.byteLength > 5 && 
                           new TextDecoder().decode(fileData.slice(0, 5)).toLowerCase() === 'solid';
            
            console.log('STL format detected:', isASCII ? 'ASCII' : 'Binary');
            
            if (isASCII) {
              // For ASCII STL, convert to text and parse
              const text = new TextDecoder().decode(fileData);
              console.log('ASCII STL length:', text.length, 'chars');
              
              // Create a temporary binary STL from ASCII (safer)
              const geometry = new THREE.BufferGeometry();
              const vertices: number[] = [];
              
              const vertexPattern = /vertex\s+([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)/g;
              
              let match;
              while ((match = vertexPattern.exec(text)) !== null) {
                vertices.push(parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]));
              }
              
              console.log('Extracted', vertices.length / 3, 'vertices from ASCII STL');
              
              if (vertices.length === 0) {
                throw new Error('No vertices found in ASCII STL');
              }
              
              geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
              loadedGeometry = geometry;
            } else {
              // Binary STL - validate header
              if (fileData.byteLength < 84) {
                throw new Error('Binary STL file too small (< 84 bytes)');
              }
              
              const triangleCount = view.getUint32(80, true);
              console.log('Binary STL reports', triangleCount, 'triangles');
              
              const expectedSize = 84 + (triangleCount * 50);
              if (fileData.byteLength < expectedSize) {
                console.warn('Binary STL size mismatch: expected', expectedSize, 'got', fileData.byteLength);
              }
              
              // Check if triangle count is reasonable (max 10 million triangles)
              if (triangleCount > 10000000) {
                throw new Error(`Suspicious triangle count: ${triangleCount} - file may be corrupted`);
              }
              
              loadedGeometry = loader.parse(fileData);
            }
            
            if (!loadedGeometry.attributes.position || loadedGeometry.attributes.position.count === 0) {
              throw new Error('STL contains no vertices');
            }
            
            console.log('✓ STL loaded:', loadedGeometry.attributes.position.count, 'vertices');
          } catch (err) {
            console.error('STL parse error:', err);
            throw new Error(`STL parse failed: ${err instanceof Error ? err.message : 'unknown error'}`);
          }
        } else if (model.fileType === 'obj') {
          const loader = new OBJLoader();
          try {
            const text = new TextDecoder().decode(fileData);
            console.log('OBJ file size:', text.length, 'characters');
            
            if (text.length === 0) {
              throw new Error('OBJ file is empty');
            }
            
            const result = loader.parse(text);
            console.log('OBJ parsed, children:', result.children.length);
            
            // Try all methods to extract geometry
            result.traverse((child: any) => {
              if (child.geometry && !loadedGeometry) {
                loadedGeometry = child.geometry;
                console.log('✓ Found geometry via traverse');
              }
            });
            
            // If still no geometry, try to manually extract from OBJ data
            if (!loadedGeometry && result.children.length > 0) {
              const firstChild = result.children[0] as any;
              if (firstChild.geometry) {
                loadedGeometry = firstChild.geometry;
                console.log('✓ Using first child geometry');
              }
            }
            
            // Last resort: create geometry from all children
            if (!loadedGeometry) {
              const mergedGeometry = new THREE.BufferGeometry();
              const positions: number[] = [];
              
              result.traverse((child: any) => {
                if (child.geometry && child.geometry.attributes && child.geometry.attributes.position) {
                  const pos = child.geometry.attributes.position.array;
                  for (let i = 0; i < pos.length; i++) {
                    positions.push(pos[i]);
                  }
                }
              });
              
              if (positions.length > 0) {
                mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                loadedGeometry = mergedGeometry;
                console.log('✓ Created merged geometry from', positions.length / 3, 'vertices');
              }
            }
            
            if (!loadedGeometry) {
              throw new Error('OBJ file contains no valid geometry data');
            }
            
            console.log('✓ OBJ loaded successfully');
          } catch (err) {
            console.error('OBJ parse error:', err);
            throw new Error(`Failed to parse OBJ: ${err instanceof Error ? err.message : 'unknown error'}`);
          }
        } else if (model.fileType === 'gltf' || model.fileType === 'glb') {
          const loader = new GLTFLoader();
          try {
            console.log('Loading GLTF/GLB');
            
            // Parse ArrayBuffer directly
            const gltf = await new Promise<any>((resolve, reject) => {
              try {
                loader.parse(fileData, '', resolve, reject);
              } catch (parseErr) {
                reject(parseErr);
              }
            });
            
            console.log('GLTF/GLB parsed, scene children:', gltf.scene.children.length);
            
            gltf.scene.traverse((child: any) => {
              if (child instanceof THREE.Mesh && !loadedGeometry) {
                loadedGeometry = child.geometry;
                console.log('✓ Found mesh in GLTF/GLB');
              }
            });
            
            if (!loadedGeometry) {
              throw new Error('No mesh found in GLTF/GLB file');
            }
            
            console.log('✓ GLTF/GLB loaded successfully');
          } catch (err) {
            console.error('GLTF/GLB parse error:', err);
            throw new Error(`GLTF/GLB parse failed: ${err instanceof Error ? err.message : 'unknown error'}`);
          }
        }

        if (loadedGeometry) {
          loadedGeometry.computeVertexNormals();
          loadedGeometry.computeBoundingBox();
          loadedGeometry.center();
          
          // Log bounding box for debugging
          const bbox = loadedGeometry.boundingBox;
          if (bbox) {
            const size = new THREE.Vector3();
            bbox.getSize(size);
            console.log('Model bounding box size:', size.x, size.y, size.z);
            console.log('Model vertices:', loadedGeometry.attributes.position.count);
            
            // Auto-scale very small or very large models
            const maxDim = Math.max(size.x, size.y, size.z);
            console.log('Max dimension:', maxDim);
            
            // If model is in mm and very small in Three.js units, scale it up
            if (maxDim < 1) {
              console.warn('Model is very small (max dimension < 1 unit), scaling up by 10x');
              loadedGeometry.scale(10, 10, 10);
            } else if (maxDim > 1000) {
              console.warn('Model is very large (max dimension > 1000 units), scaling down');
              const scaleFactor = 100 / maxDim;
              loadedGeometry.scale(scaleFactor, scaleFactor, scaleFactor);
            }
          }
          
          setGeometry(loadedGeometry);
          setLoading(false);
          console.log('Model loaded successfully');
        } else {
          setError('Failed to extract geometry');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading model:', err);
        setError(`Load error: ${err}`);
        setLoading(false);
      }
    };

    loadModel();
  }, [model.uploadedFile, model.fileType, model.name]);

  if (error) {
    return (
      <mesh>
        <boxGeometry args={[5, 5, 5]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>
    );
  }

  if (loading || !geometry) {
    return (
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#666666" wireframe />
      </mesh>
    );
  }

  return (
    <Center>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial 
          color={model.color || '#e67e22'} 
          metalness={0.7} 
          roughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </Center>
  );
};

const ModelGeometry = ({ model }: { model: Model3D }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    console.log('ModelViewer3D rendering model:', model);
  }, [model]);

  if (model.geometryType === 'uploaded') {
    return <UploadedModel model={model} />;
  }

  const renderGeometry = () => {
    const color = model.color || '#3498db';

    switch (model.geometryType) {
      case 'box':
        return (
          <mesh ref={meshRef} castShadow receiveShadow>
            <boxGeometry
              args={[
                (model.dimensions?.width || 100) / 10,
                (model.dimensions?.depth || 2) / 10,
                (model.dimensions?.height || 50) / 10,
              ]}
            />
            <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
          </mesh>
        );

      case 'cylinder':
        return (
          <mesh ref={meshRef} castShadow receiveShadow>
            <cylinderGeometry
              args={[
                (model.dimensions?.radius || 20) / 10,
                (model.dimensions?.radius || 20) / 10,
                (model.dimensions?.height || 100) / 10,
                32,
              ]}
            />
            <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
          </mesh>
        );

      case 'lProfile':
        return (
          <group>
            {/* Horizontal part */}
            <mesh position={[4, -2.75, 0]} castShadow receiveShadow>
              <boxGeometry args={[8, 0.5, (model.dimensions?.depth || 5) / 10]} />
              <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Vertical part */}
            <mesh position={[0.25, 0.5, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.5, 6, (model.dimensions?.depth || 5) / 10]} />
              <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
            </mesh>
          </group>
        );

      case 'tProfile':
        return (
          <group>
            {/* Horizontal part (top) */}
            <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
              <boxGeometry args={[6, 0.5, (model.dimensions?.depth || 5) / 10]} />
              <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Vertical part (stem) */}
            <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
              <boxGeometry args={[1, 5, (model.dimensions?.depth || 5) / 10]} />
              <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
            </mesh>
          </group>
        );

      default:
        return (
          <mesh ref={meshRef} castShadow receiveShadow>
            <boxGeometry args={[5, 5, 5]} />
            <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
          </mesh>
        );
    }
  };

  return <>{renderGeometry()}</>;
};

const ModelViewer3D = ({ model }: ModelViewer3DProps) => {
  if (!model) {
    return (
      <div className="model-viewer-3d">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>
          No model selected
        </div>
      </div>
    );
  }

  console.log('Rendering ModelViewer3D with model:', model);

  try {
    return (
      <div className="model-viewer-3d">
        <Canvas shadows gl={{ antialias: true }} dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[15, 15, 15]} />
          <OrbitControls enablePan enableZoom enableRotate />

          {/* Lights */}
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <pointLight position={[-10, -10, -5]} intensity={0.5} />

          {/* Model */}
          <ModelGeometry model={model} />

          {/* Ground plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]} receiveShadow>
            <planeGeometry args={[50, 50]} />
            <meshStandardMaterial color="#95a5a6" />
          </mesh>

          {/* Grid helper */}
          <gridHelper args={[50, 50, '#bdc3c7', '#ecf0f1']} position={[0, -4.99, 0]} />
        </Canvas>
        
        <div className="viewer-controls">
          <p>🖱️ Left click + drag to rotate | Scroll to zoom | Right click + drag to pan</p>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering 3D viewer:', error);
    return (
      <div className="model-viewer-3d">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white', flexDirection: 'column', gap: '1rem' }}>
          <div>Failed to render 3D model</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>{model.name}</div>
        </div>
      </div>
    );
  }
};

export default ModelViewer3D;
