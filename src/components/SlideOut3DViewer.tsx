import { lazy, Suspense } from 'react';
import { Model3D, Product } from '../types';
import ErrorBoundary from './ErrorBoundary';
import './SlideOut3DViewer.css';

const ModelViewer3D = lazy(() => import('./SimpleModelViewer'));

interface SlideOut3DViewerProps {
  isOpen: boolean;
  model: Model3D | null;
  product?: Product;
  onClose: () => void;
  onProductUpdate?: (product: Product) => void;
}

const SlideOut3DViewer = ({ isOpen, model, product, onClose, onProductUpdate }: SlideOut3DViewerProps) => {
  if (!model) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="slideout-backdrop" onClick={onClose} />}
      
      {/* Slide-out Panel */}
      <div className={`slideout-3d-viewer ${isOpen ? 'open' : ''}`}>
        <div className="slideout-header">
          <h3>{model.name}</h3>
          <button className="slideout-close-button" onClick={onClose} title="Close 3D viewer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        
        <div className="slideout-content">
          <ErrorBoundary fallback={
            <div className="slideout-error">
              <h3>3D Viewer Error</h3>
              <p>Model: {model.name}</p>
              <button onClick={onClose}>Close</button>
            </div>
          }>
            <Suspense fallback={
              <div className="slideout-loading">
                <div className="spinner"></div>
                <p>Loading 3D model...</p>
              </div>
            }>
              <ModelViewer3D model={model} product={product} onProductUpdate={onProductUpdate} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </>
  );
};

export default SlideOut3DViewer;
