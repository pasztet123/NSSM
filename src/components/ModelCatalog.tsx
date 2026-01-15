import { useState } from 'react';
import { Model3D, Product } from '../types';
import './ModelCatalog.css';

interface ModelCatalogProps {
  models: Model3D[];
  selectedModelId: string | null;
  onSelectModel: (model: Model3D) => void;
  onDeleteModel: (modelId: string) => void;
  uploadedModelIds: string[];
  onClose: () => void;
  products?: Product[];
  onAssignToProduct?: (modelId: string, productId: string) => void;
}

const ModelCatalog = ({
  models,
  selectedModelId,
  onSelectModel,
  onDeleteModel,
  uploadedModelIds,
  onClose,
  products,
  onAssignToProduct,
}: ModelCatalogProps) => {
  const [editMode, setEditMode] = useState(false);

  return (
    <div className="model-catalog-overlay">
      <div className="model-catalog">
        <div className="catalog-header">
          <h2>3D Model Catalog</h2>
          <div className="header-actions">
            {products && onAssignToProduct && (
              <button 
                className={`edit-mode-button ${editMode ? 'active' : ''}`}
                onClick={() => setEditMode(!editMode)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {editMode ? 'Exit Edit Mode' : 'Edit Mode'}
              </button>
            )}
            <button className="close-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          </div>
        </div>

        <div className="catalog-description">
          <p>{editMode ? 'Edit Mode: Assign models to products using the dropdown menus' : 'Select a model to load its 2D sketch onto the canvas'}</p>
        </div>

        <div className="catalog-grid">
          {models.map((model) => (
            <div
              key={model.id}
              className={`catalog-item ${selectedModelId === model.id ? 'selected' : ''}`}
              onClick={() => onSelectModel(model)}
            >
              <div className="catalog-item-preview" style={{ backgroundColor: model.color }}>
                <div className="geometry-icon">
                  {model.geometryType === 'box' && '□'}
                  {model.geometryType === 'cylinder' && '○'}
                  {model.geometryType === 'lProfile' && 'L'}
                  {model.geometryType === 'tProfile' && 'T'}
                </div>
              </div>
              <div className="catalog-item-info">
                <h3>{model.name}</h3>
                <p>{model.description}</p>
                <div className="catalog-item-meta">
                  {model.sketch2D.points.length} points • {model.sketch2D.segments.length} segments
                </div>
              </div>
              <div className="catalog-item-actions">
                <button
                  className="load-model-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectModel(model);
                  }}
                >
                  Load Model
                </button>
                {editMode && products && onAssignToProduct && products.length > 0 && (
                  <select
                    className="assign-product-select"
                    onChange={(e) => {
                      if (e.target.value) {
                        onAssignToProduct(model.id, e.target.value);
                        e.target.value = ''; // Reset selection
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="">Assign to Product...</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                )}
                {uploadedModelIds.includes(model.id) && (
                  <button
                    className="delete-model-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteModel(model.id);
                    }}
                    title="Delete model"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="3 6 5 6 21 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="10" y1="11" x2="10" y2="17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="14" y1="11" x2="14" y2="17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModelCatalog;
