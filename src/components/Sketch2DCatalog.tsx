import { useState } from 'react';
import { Product, Point, Segment } from '../types';
import './Sketch2DCatalog.css';

interface Sketch2D {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  sketch2D: {
    points: Point[];
    segments: Segment[];
  };
}

interface Sketch2DCatalogProps {
  sketches: Sketch2D[];
  onSelectSketch: (sketch: Sketch2D) => void;
  onClose: () => void;
  products?: Product[];
  onAssignToProduct?: (sketchId: string, productId: string) => void;
  savedSketchIds?: string[];
  onDeleteSketch?: (sketchId: string) => void;
}

const Sketch2DCatalog = ({
  sketches,
  onSelectSketch,
  onClose,
  products,
  onAssignToProduct,
  savedSketchIds,
  onDeleteSketch,
}: Sketch2DCatalogProps) => {
  const [editMode, setEditMode] = useState(false);

  // Group sketches by category
  const groupedSketches = sketches.reduce((acc, sketch) => {
    if (!acc[sketch.category]) {
      acc[sketch.category] = [];
    }
    acc[sketch.category].push(sketch);
    return acc;
  }, {} as Record<string, Sketch2D[]>);

  return (
    <div className="sketch-catalog-overlay">
      <div className="sketch-catalog">
        <div className="catalog-header">
          <h2>2D Sketch Catalog</h2>
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
          <p>{editMode ? 'Edit Mode: Assign 2D sketches to products using the dropdown menus' : 'Select a 2D sketch to load onto the canvas'}</p>
        </div>

        <div className="catalog-content">
          {Object.entries(groupedSketches).map(([category, categorySketchs]) => (
            <div key={category} className="sketch-category">
              <h3 className="category-title">{category}</h3>
              <div className="sketch-grid">
                {categorySketchs.map((sketch) => (
                  <div
                    key={sketch.id}
                    className="sketch-item"
                    onClick={() => !editMode && onSelectSketch(sketch)}
                  >
                    <div className="sketch-item-preview">
                      <div className="sketch-thumbnail">{sketch.thumbnail}</div>
                    </div>
                    <div className="sketch-item-info">
                      <h4>{sketch.name}</h4>
                      <p>{sketch.description}</p>
                      <div className="sketch-item-meta">
                        {sketch.sketch2D.points.length} points • {sketch.sketch2D.segments.length} segments
                      </div>
                    </div>
                    <div className="sketch-item-actions">
                      <button
                        className="load-sketch-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSketch(sketch);
                        }}
                      >
                        Load Sketch
                      </button>
                      {editMode && products && onAssignToProduct && products.length > 0 && (
                        <select
                          className="assign-product-select"
                          onChange={(e) => {
                            if (e.target.value) {
                              onAssignToProduct(sketch.id, e.target.value);
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
                      {savedSketchIds && onDeleteSketch && savedSketchIds.includes(sketch.id) && (
                        <button
                          className="delete-sketch-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSketch(sketch.id);
                          }}
                          title="Delete sketch"
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sketch2DCatalog;
