import { useEffect, useState, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Model3D, Product } from '../types';
import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';
import { download3DModelFile } from '../lib/storage';
import './ModelViewer3D.css';

interface SimpleModelViewerProps {
  model: Model3D;
  product?: Product;
  onProductUpdate?: (product: Product) => void;
}

const UploadedModel = ({ model, rotation, color }: { model: Model3D; rotation: [number, number, number]; color?: string }) => {
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
    <mesh geometry={geometry} castShadow receiveShadow rotation={rotation}>
      <meshStandardMaterial 
        color={color || model.color || '#ffffff'} 
        metalness={0.7} 
        roughness={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// Camera controller component to handle view changes
const CameraController = ({ 
  controlsRef 
}: { 
  controlsRef: React.MutableRefObject<any> 
}) => {
  const { camera } = useThree();

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.camera = camera;
    }
  }, [camera, controlsRef]);

  return null;
};

const SimpleModelViewer = ({ model, product, onProductUpdate }: SimpleModelViewerProps) => {
  const controlsRef = useRef<any>(null);
  const [animating, setAnimating] = useState(false);
  const [rotation, setRotation] = useState<[number, number, number]>(
    product?.model3DRotation || [0, 0, Math.PI / 2]
  );
  const [saving, setSaving] = useState(false);
  const [modelColor, setModelColor] = useState<string>(model.color || '#ffffff');
  const [colorPickerCollapsed, setColorPickerCollapsed] = useState(false);

  // Update rotation when product changes
  useEffect(() => {
    console.log('🔄 Product changed, updating rotation:', {
      productId: product?.id,
      savedRotation: product?.model3DRotation,
      savedRotationDegrees: product?.model3DRotation?.map(r => (r * 180 / Math.PI).toFixed(2))
    });
    
    if (product?.model3DRotation) {
      setRotation(product.model3DRotation);
    } else {
      setRotation([0, 0, Math.PI / 2]);
    }
  }, [product?.id, product?.model3DRotation]);

  // Update color when model changes
  useEffect(() => {
    setModelColor(model.color || '#ffffff');
  }, [model.id, model.color]);

  // Auto-save color when it changes
  useEffect(() => {
    if (!model || !product || !onProductUpdate) return;
    
    const savedColor = model.color || '#ffffff';
    if (modelColor === savedColor) return;
    
    const timer = setTimeout(() => {
      console.log('🎨 Saving color:', modelColor);
      // Update the model's color
      const updatedModel = { ...model, color: modelColor };
      const updatedProduct = { ...product, model3D: updatedModel };
      onProductUpdate(updatedProduct);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [modelColor, model, product, onProductUpdate]);

  console.log('=== VIEWER RENDER ===');
  console.log('Model:', model);
  console.log('Product:', product);

  const handleRotationChange = (axis: 0 | 1 | 2, degrees: number) => {
    const newRotation: [number, number, number] = [...rotation];
    newRotation[axis] = (degrees * Math.PI) / 180;
    setRotation(newRotation);
  };

  const saveRotation = async () => {
    if (!product) {
      alert('Cannot save: No product selected');
      return;
    }

    setSaving(true);
    try {
      const updatedProduct = { ...product, model3DRotation: rotation };
      
      console.log('💾 Saving rotation:', {
        productId: product.id,
        productName: product.name,
        rotation: rotation,
        rotationDegrees: rotation.map(r => (r * 180 / Math.PI).toFixed(2))
      });
      
      if (onProductUpdate) {
        onProductUpdate(updatedProduct);
        console.log('✓ Rotation saved successfully');
        alert('Rotation saved successfully!');
      } else {
        console.error('❌ No update handler provided');
        alert('Cannot save: No update handler provided');
      }
    } catch (err) {
      console.error('❌ Error saving rotation:', err);
      alert('Failed to save rotation');
    } finally {
      setSaving(false);
    }
  };

  const resetRotation = () => {
    setRotation([0, 0, Math.PI / 2]);
  };

  const animateCamera = (targetPosition: [number, number, number], duration: number = 600) => {
    if (!controlsRef.current) return;
    
    setAnimating(true);
    const controls = controlsRef.current;
    const camera = controls.object;
    
    const startPosition = camera.position.clone();
    const endPosition = new THREE.Vector3(...targetPosition);
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-in-out)
      const eased = progress < 0.5
        ? 2 * progress * progress
        : -1 + (4 - 2 * progress) * progress;
      
      camera.position.lerpVectors(startPosition, endPosition, eased);
      controls.update();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setAnimating(false);
      }
    };
    
    animate();
  };

  const setViewFront = () => animateCamera([0, 0, 20]);
  const setViewBack = () => animateCamera([0, 0, -20]);
  const setViewLeft = () => animateCamera([-20, 0, 0]);
  const setViewRight = () => animateCamera([20, 0, 0]);
  const setViewTop = () => animateCamera([0, 20, 0]);
  const setViewBottom = () => animateCamera([0, -20, 0]);
  const setViewPerspective = () => animateCamera([15, 15, 15]);

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
        <OrbitControls 
          ref={controlsRef}
          enablePan 
          enableZoom 
          enableRotate 
          enabled={!animating}
        />
        <CameraController controlsRef={controlsRef} />

        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        <UploadedModel model={model} rotation={rotation} color={modelColor} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#95a5a6" />
        </mesh>

        <gridHelper args={[50, 50, '#bdc3c7', '#ecf0f1']} position={[0, -4.99, 0]} />
      </Canvas>
      
      <div className="viewer-controls">
        <p>🖱️ Left click + drag to rotate | Scroll to zoom | Right click + drag to pan</p>
      </div>

      {/* Color Picker */}
      <div className="color-picker-panel" style={{
        position: 'absolute',
        top: '10px',
        right: '360px',
        background: '#323E48',
        padding: '0',
        borderRadius: '8px',
        color: 'white',
        minWidth: colorPickerCollapsed ? '160px' : '200px',
        zIndex: 10,
        fontSize: '13px',
        overflow: 'hidden',
        border: '2px solid #dee2e6',
      }}>
        <div style={{
          background: '#0d2847',
          padding: '8px 12px',
          borderBottom: colorPickerCollapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }} onClick={() => setColorPickerCollapsed(!colorPickerCollapsed)}>
          <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#B8943C' }}>🎨</span>
            Model Color
          </h3>
          <span style={{ fontSize: '16px', transition: 'transform 0.2s', transform: colorPickerCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
        </div>

        {!colorPickerCollapsed && (
          <div style={{ padding: '12px' }}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                Choose color:
              </label>
              <input
                type="color"
                value={modelColor}
                onChange={(e) => setModelColor(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  border: '2px solid #dee2e6',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {['#5dade2', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#34495e', '#c0c0c0', '#ffffff', '#c0392b', '#16a085'].map((color) => (
                <button
                  key={color}
                  onClick={() => setModelColor(color)}
                  style={{
                    width: '30px',
                    height: '30px',
                    background: color,
                    border: modelColor === color ? '3px solid #B8943C' : (color === '#ffffff' ? '2px solid #95a5a6' : '2px solid #dee2e6'),
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  title={`Set color to ${color}`}
                />
              ))}
            </div>

            <div style={{ fontSize: '11px', color: '#bdc3c7', marginBottom: '8px' }}>
              Current: <span style={{ 
                fontWeight: '600', 
                color: modelColor,
                background: 'white',
                padding: '2px 6px',
                borderRadius: '3px',
                fontFamily: 'monospace'
              }}>{modelColor}</span>
            </div>
          </div>
        )}
      </div>

      {/* Rotation Controls */}
      <div className="rotation-controls" style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: '#323E48',
        padding: '0',
        borderRadius: '8px',
        color: 'white',
        minWidth: '220px',
        maxWidth: '220px',
        zIndex: 10,
        fontSize: '13px',
        overflow: 'hidden',
        border: '2px solid #dee2e6',
      }}>
        <div style={{
          background: '#0d2847',
          padding: '8px 12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#B8943C' }}>🔄</span>
            Model Rotation
          </h3>
        </div>

        <div style={{ padding: '12px' }}>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600' }}>X:</label>
              <input
                type="number"
                min="0"
                max="360"
                value={Math.round((rotation[0] * 180) / Math.PI)}
                onChange={(e) => handleRotationChange(0, parseFloat(e.target.value) || 0)}
                style={{
                  width: '60px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  background: 'white',
                  border: '2px solid #dee2e6',
                  borderRadius: '4px',
                  color: '#2c3e50',
                  fontWeight: '600',
                  textAlign: 'right',
                }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={(rotation[0] * 180) / Math.PI}
              onChange={(e) => handleRotationChange(0, parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#B8943C' }}
            />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600' }}>Y:</label>
              <input
                type="number"
                min="0"
                max="360"
                value={Math.round((rotation[1] * 180) / Math.PI)}
                onChange={(e) => handleRotationChange(1, parseFloat(e.target.value) || 0)}
                style={{
                  width: '60px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  background: 'white',
                  border: '2px solid #dee2e6',
                  borderRadius: '4px',
                  color: '#2c3e50',
                  fontWeight: '600',
                  textAlign: 'right',
                }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={(rotation[1] * 180) / Math.PI}
              onChange={(e) => handleRotationChange(1, parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#B8943C' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600' }}>Z:</label>
              <input
                type="number"
                min="0"
                max="360"
                value={Math.round((rotation[2] * 180) / Math.PI)}
                onChange={(e) => handleRotationChange(2, parseFloat(e.target.value) || 0)}
                style={{
                  width: '60px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  background: 'white',
                  border: '2px solid #dee2e6',
                  borderRadius: '4px',
                  color: '#2c3e50',
                  fontWeight: '600',
                  textAlign: 'right',
                }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={(rotation[2] * 180) / Math.PI}
              onChange={(e) => handleRotationChange(2, parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#B8943C' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={saveRotation}
              disabled={saving}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: '#B8943C',
                border: '2px solid #B8943C',
                borderRadius: '6px',
                color: 'white',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '11px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                opacity: saving ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.currentTarget.style.background = '#c9a34f';
                  e.currentTarget.style.borderColor = '#c9a34f';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#B8943C';
                e.currentTarget.style.borderColor = '#B8943C';
              }}
            >
              {saving ? 'Saving...' : '💾 Save'}
            </button>
            <button
              onClick={resetRotation}
              style={{
                padding: '8px 12px',
                background: 'white',
                border: '2px solid #bdc3c7',
                borderRadius: '6px',
                color: '#2c3e50',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#B8943C';
                e.currentTarget.style.borderColor = '#B8943C';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#bdc3c7';
                e.currentTarget.style.color = '#2c3e50';
              }}
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      {/* View Buttons */}
      <div className="view-buttons">
        <button onClick={setViewFront} title="Front View" disabled={animating}>
          Front
        </button>
        <button onClick={setViewBack} title="Back View" disabled={animating}>
          Back
        </button>
        <button onClick={setViewLeft} title="Left View" disabled={animating}>
          Left
        </button>
        <button onClick={setViewRight} title="Right View" disabled={animating}>
          Right
        </button>
        <button onClick={setViewTop} title="Top View" disabled={animating}>
          Top
        </button>
        <button onClick={setViewBottom} title="Bottom View" disabled={animating}>
          Bottom
        </button>
        <button onClick={setViewPerspective} title="Perspective View" className="perspective-btn" disabled={animating}>
          📐 Perspective
        </button>
      </div>
    </div>
  );
};

export default SimpleModelViewer;
