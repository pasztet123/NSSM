import { useState, useEffect, lazy, Suspense } from 'react';
import DimensionCanvas from './components/DimensionCanvas';
import DimensionPanel from './components/DimensionPanel';
import ProductBar from './components/ProductBar';
import Toolbar from './components/Toolbar';
import ErrorBoundary from './components/ErrorBoundary';
import Auth from './components/Auth';
// Lazy load 3D viewer to avoid blocking main app
const ModelViewer3D = lazy(() => import('./components/SimpleModelViewer'));
const ModelCatalog = lazy(() => import('./components/ModelCatalog'));
const ModelUploader = lazy(() => import('./components/SimpleModelUploader'));
const Sketch2DCatalog = lazy(() => import('./components/Sketch2DCatalog'));
const SketchSaver = lazy(() => import('./components/SketchSaver'));
import { Point, Segment, Unit, Model3D, Product, Material, convertToPixels } from './types';
import { sampleModels } from './data/sampleModels';
import { sample2DSketches } from './data/sample2DSketches';
import { sampleProducts } from './data/sampleProducts';
import { materials } from './data/materials';
import { defaultPricingConfig, PricingConfig } from './data/pricingConfig';
import { get3DModels, get3DModel, save2DSketch, get2DSketches, saveProductsToLocalStorage, loadProductsFromLocalStorage } from './lib/storage';
import { User } from '@supabase/supabase-js';
import MaterialSelector from './components/MaterialSelector';
import PriceDisplay from './components/PriceDisplay';
import './App.css';

function App() {
  const [points, setPoints] = useState<Point[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [mode, setMode] = useState<'select' | 'addPoint' | 'addSegment'>('select');
  const [unit, setUnit] = useState<Unit>('inch');
  const [showModelCatalog, setShowModelCatalog] = useState(false);
  const [showSketchCatalog, setShowSketchCatalog] = useState(false);
  const [showSketchSaver, setShowSketchSaver] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model3D | null>(null);
  const [show3DViewer, setShow3DViewer] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [uploadedModels, setUploadedModels] = useState<Model3D[]>([]);
  const [savedSketches, setSavedSketches] = useState<Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    thumbnail: string;
    sketch2D: { points: Point[]; segments: Segment[] };
  }>>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);
  const [products, setProducts] = useState<Product[]>(() => {
    // Always use fresh sampleProducts to ensure model3DId updates are reflected
    saveProductsToLocalStorage(sampleProducts);
    return sampleProducts;
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    return sampleProducts.find(p => p.id === 'prod-4') || null;
  });
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>(materials);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(defaultPricingConfig);
  
  // Suppress unused variable warning (used for loading state)
  void loadingModels;

  // Load user's models from Supabase when authenticated
  useEffect(() => {
    if (user) {
      loadUserModels();
      loadUserSketches();
    } else {
      setUploadedModels([]);
      setSavedSketches([]);
    }
  }, [user]);

  const loadUserModels = async () => {
    setLoadingModels(true);
    try {
      const { models, error } = await get3DModels();
      if (error) {
        console.error('Error loading models:', error);
      } else {
        setUploadedModels(models);
      }
    } finally {
      setLoadingModels(false);
    }
  };

  const loadUserSketches = async () => {
    try {
      const { sketches, error } = await get2DSketches();
      if (error) {
        console.error('Error loading sketches:', error);
      } else {
        setSavedSketches(sketches);
      }
    } catch (error) {
      console.error('Error loading sketches:', error);
    }
  };

  const addPoint = (x: number, y: number) => {
    const newPoint: Point = {
      id: `point-${Date.now()}`,
      x,
      y,
    };
    setPoints([...points, newPoint]);

    // Auto-connect to the last point if exists
    if (points.length > 0) {
      const lastPoint = points[points.length - 1];
      const dx = x - lastPoint.x;
      const dy = y - lastPoint.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate angle
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      const newSegment: Segment = {
        id: `segment-${Date.now()}`,
        startPointId: lastPoint.id,
        endPointId: newPoint.id,
        length,
        angle,
        label: String.fromCharCode(65 + segments.length), // A, B, C, ...
      };
      setSegments([...segments, newSegment]);
    }
  };

  const addSegment = (startPointId: string, endPointId: string) => {
    const startPoint = points.find(p => p.id === startPointId);
    const endPoint = points.find(p => p.id === endPointId);
    
    if (!startPoint || !endPoint) return;

    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    const newSegment: Segment = {
      id: `segment-${Date.now()}`,
      startPointId,
      endPointId,
      length,
      angle,
      label: String.fromCharCode(65 + segments.length),
    };
    
    setSegments([...segments, newSegment]);
  };

  const updatePointPosition = (pointId: string, x: number, y: number) => {
    setPoints(points.map(p => (p.id === pointId ? { ...p, x, y } : p)));

    // Update connected segments
    setSegments(segments.map(segment => {
      if (segment.startPointId === pointId || segment.endPointId === pointId) {
        const startPoint = points.find(p => p.id === segment.startPointId);
        const endPoint = points.find(p => p.id === segment.endPointId);
        
        if (startPoint && endPoint) {
          const start = segment.startPointId === pointId ? { x, y } : startPoint;
          const end = segment.endPointId === pointId ? { x, y } : endPoint;
          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          return { ...segment, length };
        }
      }
      return segment;
    }));
  };

  const updateSegmentLength = (segmentId: string, newLength: number) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;

    const startPoint = points.find(p => p.id === segment.startPointId);
    const endPoint = points.find(p => p.id === segment.endPointId);
    
    if (!startPoint || !endPoint) return;

    // Calculate current angle
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const angle = Math.atan2(dy, dx);

    // Convert length from units to pixels
    const newLengthPixels = convertToPixels(newLength, unit);

    // Update end point position based on new length
    const newX = startPoint.x + newLengthPixels * Math.cos(angle);
    const newY = startPoint.y + newLengthPixels * Math.sin(angle);

    updatePointPosition(endPoint.id, newX, newY);
  };

  const updateSegmentAngle = (segmentId: string, newAngle: number) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;

    const startPoint = points.find(p => p.id === segment.startPointId);
    const endPoint = points.find(p => p.id === segment.endPointId);
    
    if (!startPoint || !endPoint) return;

    // Convert angle from degrees to radians
    const angleRad = newAngle * (Math.PI / 180);

    // Keep the same length, update end point position
    const newX = startPoint.x + segment.length * Math.cos(angleRad);
    const newY = startPoint.y + segment.length * Math.sin(angleRad);

    updatePointPosition(endPoint.id, newX, newY);
    
    // Update segment angle
    setSegments(segments.map(s => 
      s.id === segmentId ? { ...s, angle: newAngle } : s
    ));
  };

  const rotateShape = (angle: number) => {
    if (points.length === 0) return;

    // Find center point
    const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;

    const angleRad = angle * (Math.PI / 180);
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    // Rotate all points around center
    setPoints(points.map(p => {
      const dx = p.x - centerX;
      const dy = p.y - centerY;
      return {
        ...p,
        x: centerX + dx * cos - dy * sin,
        y: centerY + dx * sin + dy * cos,
      };
    }));

    // Update segment angles
    setSegments(segments.map(s => {
      const startPoint = points.find(p => p.id === s.startPointId);
      const endPoint = points.find(p => p.id === s.endPointId);
      if (startPoint && endPoint) {
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;
        const newAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        return { ...s, angle: newAngle };
      }
      return s;
    }));
  };

  const deletePoint = (pointId: string) => {
    setPoints(points.filter(p => p.id !== pointId));
    setSegments(segments.filter(s => s.startPointId !== pointId && s.endPointId !== pointId));
    if (selectedPointId === pointId) setSelectedPointId(null);
  };
  
  // Available for future use
  void deletePoint;

  const deleteSegment = (segmentId: string) => {
    setSegments(segments.filter(s => s.id !== segmentId));
    if (selectedSegmentId === segmentId) setSelectedSegmentId(null);
  };

  const clearAll = () => {
    setPoints([]);
    setSegments([]);
    setSelectedPointId(null);
    setSelectedSegmentId(null);
  };

  const loadModel = (model: Model3D) => {
    setSelectedModel(model);
    setShowModelCatalog(false);
  };

  const handleProductSelection = async (product: Product) => {
    setSelectedProduct(product);
    
    // If product has a model3DId, load from database
    if (product.model3DId) {
      try {
        const { model, error } = await get3DModel(product.model3DId);
        if (error) {
          console.error('Error loading product model:', error);
          // Fallback to model3D if available
          if (product.model3D) {
            setSelectedModel(product.model3D);
          }
        } else if (model) {
          setSelectedModel(model);
        }
      } catch (error) {
        console.error('Error loading product model:', error);
        // Fallback to model3D if available
        if (product.model3D) {
          setSelectedModel(product.model3D);
        }
      }
    } else if (product.model3D) {
      // If product has a 3D model object, display it
      setSelectedModel(product.model3D);
    }
  };

  const handleProductUpdate = (updatedProduct: Product) => {
    const productIndex = products.findIndex(p => p.id === updatedProduct.id);
    if (productIndex === -1) return;

    const updatedProducts = [...products];
    updatedProducts[productIndex] = updatedProduct;

    setProducts(updatedProducts);
    setSelectedProduct(updatedProduct);
    saveProductsToLocalStorage(updatedProducts);
  };

  const handleMaterialSelection = (materialId: string) => {
    if (!selectedProduct) {
      alert('Please select a product first');
      return;
    }

    const productIndex = products.findIndex(p => p.id === selectedProduct.id);
    if (productIndex === -1) return;

    const updatedProducts = [...products];
    updatedProducts[productIndex] = {
      ...updatedProducts[productIndex],
      selectedMaterial: materialId,
    };

    setProducts(updatedProducts);
    setSelectedProduct(updatedProducts[productIndex]);
  };

  const handleUpdateMaterial = (materialId: string, updates: Partial<Material>) => {
    setAvailableMaterials(prevMaterials =>
      prevMaterials.map(m => m.id === materialId ? { ...m, ...updates } : m)
    );
  };

  const handleUpdateMaterialPrice = (materialId: string, price: number) => {
    handleUpdateMaterial(materialId, { sheetPrice: price });
  };

  const handleUpdateLaborCost = (productType: string, cost: number) => {
    setPricingConfig(prev => ({
      ...prev,
      laborCosts: prev.laborCosts.map(lc =>
        lc.productType === productType ? { ...lc, costPerUnit: cost } : lc
      ),
    }));
  };

  const handleUpdateProfitMargin = (margin: number) => {
    setPricingConfig(prev => ({
      ...prev,
      profitMargin: margin,
    }));
  };

  const handleAssignModelToProduct = (modelId: string, productId: string) => {
    const model = allModels.find(m => m.id === modelId);
    const productIndex = products.findIndex(p => p.id === productId);
    
    console.log('Assigning model to product:', { modelId, productId, model, productIndex });
    
    if (model && productIndex !== -1) {
      // Update the product with the assigned model
      const updatedProducts = [...products];
      updatedProducts[productIndex] = {
        ...updatedProducts[productIndex],
        model3D: model,
      };
      
      setProducts(updatedProducts);
      // Save to localStorage
      saveProductsToLocalStorage(updatedProducts);
      
      console.log('Product updated and saved:', updatedProducts[productIndex]);
      
      // If this is the currently selected product, update the 3D viewer
      if (selectedProduct?.id === productId) {
        setSelectedProduct(updatedProducts[productIndex]);
        setSelectedModel(model);
      }
      
      alert(`Model "${model.name}" assigned to product "${updatedProducts[productIndex].name}"`);
    } else {
      console.error('Could not find model or product:', { model, productIndex });
    }
  };

  const handleAssignSketchToProduct = (sketchId: string, productId: string) => {
    const sketch = sample2DSketches.find(s => s.id === sketchId);
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (sketch && productIndex !== -1) {
      // Update the product with the assigned sketch
      const updatedProducts = [...products];
      updatedProducts[productIndex] = {
        ...updatedProducts[productIndex],
        sketch2D: sketch.sketch2D,
      };
      
      setProducts(updatedProducts);
      // Save to localStorage
      saveProductsToLocalStorage(updatedProducts);
      
      // If this is the currently selected product, update the canvas
      if (selectedProduct?.id === productId) {
        setSelectedProduct(updatedProducts[productIndex]);
        setPoints(sketch.sketch2D.points);
        setSegments(sketch.sketch2D.segments);
      }
      
      alert(`2D Sketch "${sketch.name}" assigned to product "${updatedProducts[productIndex].name}"`);
    }
  };

  const loadSketch = (sketch: { sketch2D: { points: Point[]; segments: Segment[] } }) => {
    setPoints(sketch.sketch2D.points);
    setSegments(sketch.sketch2D.segments);
    setShowSketchCatalog(false);
  };

  const handleSaveSketch = async (name: string, description: string, category: string) => {
    if (!user) {
      alert('Please sign in to save sketches');
      return;
    }

    const { id, error } = await save2DSketch(name, description, points, segments, category);
    
    if (error) {
      alert(`Failed to save sketch: ${error.message}`);
      return;
    }

    if (id) {
      alert(`Sketch "${name}" saved successfully!`);
      setShowSketchSaver(false);
      // Reload sketches
      loadUserSketches();
    }
  };

  const handleDeleteSketch = async (sketchId: string) => {
    if (!confirm('Are you sure you want to delete this sketch?')) {
      return;
    }

    const { delete2DSketch } = await import('./lib/storage');
    const { error } = await delete2DSketch(sketchId);
    
    if (error) {
      alert(`Failed to delete sketch: ${error.message}`);
      return;
    }

    alert('Sketch deleted successfully!');
    // Reload sketches
    loadUserSketches();
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm('Are you sure you want to delete this model?')) {
      return;
    }

    // Check if it's an uploaded model (not a sample)
    const isUploadedModel = uploadedModels.some(m => m.id === modelId);
    
    if (!isUploadedModel) {
      alert('Cannot delete sample models');
      return;
    }

    if (user) {
      // Delete from database and storage
      const { delete3DModel } = await import('./lib/storage');
      const { error } = await delete3DModel(modelId);
      
      if (error) {
        console.error('Error deleting model:', error);
        alert('Failed to delete model: ' + error.message);
        return;
      }
      
      // Reload models from database
      loadUserModels();
    } else {
      // Delete from local state only
      setUploadedModels(uploadedModels.filter(m => m.id !== modelId));
    }

    // Clear selected model if it was deleted
    if (selectedModel?.id === modelId) {
      setSelectedModel(null);
    }
  };

  const handleModelUploaded = (model: Model3D) => {
    console.log('Model uploaded:', model);
    
    // Reload from database
    if (user) {
      loadUserModels();
    }
    
    // Set as selected model to show it immediately
    setSelectedModel(model);
    
    console.log('Model should appear in catalog after reload');
  };

  const allModels = [...sampleModels, ...uploadedModels];
  const allSketches = [...sample2DSketches, ...savedSketches];

  // Function to reset products to defaults
  const resetProducts = () => {
    if (confirm('Reset all products to default values? This will clear all assigned models.')) {
      setProducts(sampleProducts);
      saveProductsToLocalStorage(sampleProducts);
      alert('Products reset to defaults');
    }
  };

  // Expose resetProducts to window for debugging
  if (typeof window !== 'undefined') {
    (window as any).resetProducts = resetProducts;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>Sheet Metal Profile Designer</h1>
          {selectedProduct && (
            <div className="selected-product-indicator">
              <span className="product-label">Current Product:</span>
              <span className="product-name">{selectedProduct.name}</span>
            </div>
          )}
        </div>
        <Auth onAuthChange={setUser} />
      </header>

      {/* 3D Model Viewer - Top Section */}
      {selectedModel && (
        <ErrorBoundary fallback={
          <div style={{
            width: '100%',
            height: '40vh',
            background: 'linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            flexDirection: 'column',
            gap: '1rem',
            borderBottom: '2px solid #e74c3c'
          }}>
            <h3>3D Viewer Error</h3>
            <p>Model: {selectedModel.name}</p>
            <button 
              onClick={() => setSelectedModel(null)}
              style={{
                padding: '0.5rem 1rem',
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        }>
          <div className="viewer-3d-top">
            <div className="viewer-3d-header">
              <h3>{selectedModel.name}</h3>
              <button className="close-3d-button" onClick={() => setSelectedModel(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <Suspense fallback={
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                Loading 3D viewer...
              </div>
            }>
              <ModelViewer3D model={selectedModel} product={selectedProduct || undefined} onProductUpdate={handleProductUpdate} />
            </Suspense>
          </div>
        </ErrorBoundary>
      )}

      {/* 2D Dimension Design Section */}
      <div className="dimension-section">
        <div className="section-header">
          <h2>2D Dimension Design</h2>
          <p>Design product dimensions - total dimensions determine material cost</p>
        </div>
        
        {/* Material Selector */}
        {selectedProduct && (
          <MaterialSelector
            materials={availableMaterials}
            selectedMaterialId={selectedProduct.selectedMaterial}
            onSelectMaterial={handleMaterialSelection}
          />
        )}

        {/* Price Display with integrated pricing controls */}
        {selectedProduct && (
          <PriceDisplay
            segments={segments}
            points={points}
            material={availableMaterials.find(m => m.id === selectedProduct.selectedMaterial) || null}
            productType={selectedProduct.productType}
            pricingConfig={pricingConfig}
            unit={unit}
            onUpdateMaterialPrice={handleUpdateMaterialPrice}
            onUpdateLaborCost={handleUpdateLaborCost}
            onUpdateProfitMargin={handleUpdateProfitMargin}
          />
        )}
        
        <div className="dimension-workspace">
          <Toolbar 
            mode={mode}
            onModeChange={setMode}
            onClearAll={clearAll}
            unit={unit}
            onUnitChange={setUnit}
            onOpenModelCatalog={() => setShowModelCatalog(true)}
            onOpenSketchCatalog={() => setShowSketchCatalog(true)}
            onSaveSketch={() => setShowSketchSaver(true)}
            onToggle3DViewer={() => setShow3DViewer(!show3DViewer)}
            show3DViewer={show3DViewer}
            onOpenUploader={() => setShowUploader(true)}
          />
          
          <DimensionCanvas
            points={points}
            segments={segments}
            selectedPointId={selectedPointId}
            selectedSegmentId={selectedSegmentId}
            mode={mode}
            unit={unit}
            onAddPoint={addPoint}
            onAddSegment={addSegment}
            onSelectPoint={setSelectedPointId}
            onSelectSegment={setSelectedSegmentId}
            onUpdatePointPosition={updatePointPosition}
            onUpdateSegmentAngle={updateSegmentAngle}
            onRotateShape={rotateShape}
          />
          
          <DimensionPanel
            segments={segments}
            selectedSegmentId={selectedSegmentId}
            unit={unit}
            onUpdateSegmentLength={updateSegmentLength}
            onUpdateSegmentAngle={updateSegmentAngle}
            onDeleteSegment={deleteSegment}
          />
        </div>
      </div>

      {showModelCatalog && (
        <Suspense fallback={<div style={{position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '2rem', borderRadius: '8px'}}>Loading catalog...</div>}>
          <ModelCatalog
            models={allModels}
            selectedModelId={selectedModel?.id || null}
            onSelectModel={loadModel}
            onDeleteModel={handleDeleteModel}
            uploadedModelIds={uploadedModels.map(m => m.id)}
            onClose={() => setShowModelCatalog(false)}
            products={products}
            onAssignToProduct={handleAssignModelToProduct}
          />
        </Suspense>
      )}

      {showSketchCatalog && (
        <Suspense fallback={<div style={{position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '2rem', borderRadius: '8px'}}>Loading catalog...</div>}>
          <Sketch2DCatalog
            sketches={allSketches}
            onSelectSketch={loadSketch}
            onClose={() => setShowSketchCatalog(false)}
            products={products}
            onAssignToProduct={handleAssignSketchToProduct}
            savedSketchIds={savedSketches.map(s => s.id)}
            onDeleteSketch={handleDeleteSketch}
          />
        </Suspense>
      )}
      {showSketchSaver && (
        <Suspense fallback={<div style={{position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '2rem', borderRadius: '8px'}}>Loading...</div>}>
          <SketchSaver
            points={points}
            segments={segments}
            onSave={handleSaveSketch}
            onClose={() => setShowSketchSaver(false)}
          />
        </Suspense>
      )}
      {showUploader && (
        <Suspense fallback={<div style={{position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '2rem', borderRadius: '8px'}}>Loading uploader...</div>}>
          <ModelUploader
            onModelUploaded={handleModelUploaded}
            onClose={() => setShowUploader(false)}
          />
        </Suspense>
      )}
      
      {/* Product Selection Bar */}
      <ProductBar
        products={products}
        selectedProduct={selectedProduct}
        onSelectProduct={handleProductSelection}
      />
    </div>
  );
}

export default App;
