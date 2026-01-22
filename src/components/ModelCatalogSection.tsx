import { useState } from 'react';
import { Model3D } from '../types';
import './ModelCatalogSection.css';

interface ModelCatalogSectionProps {
  models: Model3D[];
  selectedModel: Model3D | null;
  onSelectModel: (model: Model3D) => void;
}

const ModelCatalogSection = ({ models, selectedModel, onSelectModel }: ModelCatalogSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={`model-catalog-section ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button 
        className="model-catalog-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2>Select 3D Model</h2>
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor"
          className={`chevron ${isExpanded ? 'up' : 'down'}`}
        >
          <polyline points="18 15 12 9 6 15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isExpanded && (
        <div className="model-catalog-content">
          <div className="model-tiles">
            {models.map((model) => (
              <button
                key={model.id}
                className={`model-tile ${selectedModel?.id === model.id ? 'active' : ''}`}
                onClick={() => onSelectModel(model)}
              >
                <div className="model-tile-image">
                  <div className="model-tile-no-image">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" strokeWidth="2"/>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" strokeWidth="2"/>
                      <line x1="12" y1="22.08" x2="12" y2="12" strokeWidth="2"/>
                    </svg>
                  </div>
                </div>
                <div className="model-tile-content">
                  <h4>{model.name}</h4>
                  <p className="model-tile-type">{model.geometryType}</p>
                </div>
                {selectedModel?.id === model.id && (
                  <div className="model-tile-selected">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white">
                      <polyline points="20 6 9 17 4 12" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelCatalogSection;
