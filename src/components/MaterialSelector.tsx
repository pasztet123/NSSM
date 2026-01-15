import { Material } from '../types';
import './MaterialSelector.css';

interface MaterialSelectorProps {
  materials: Material[];
  selectedMaterialId: string | undefined;
  onSelectMaterial: (materialId: string) => void;
}

const MaterialSelector = ({ materials, selectedMaterialId, onSelectMaterial }: MaterialSelectorProps) => {
  return (
    <div className="material-selector">
      <label className="material-selector-label">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 9h18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 21V9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Material:
      </label>
      <select 
        className="material-selector-dropdown"
        value={selectedMaterialId || ''}
        onChange={(e) => onSelectMaterial(e.target.value)}
      >
        <option value="">Select Material...</option>
        {materials.map((material) => (
          <option key={material.id} value={material.id}>
            {material.name} - ${material.sheetPrice.toFixed(2)}/sheet ({material.sheetWidth}×{material.sheetLength}")
          </option>
        ))}
      </select>
      {selectedMaterialId && (
        <div className="material-info">
          {(() => {
            const material = materials.find(m => m.id === selectedMaterialId);
            return material ? (
              <>
                <div 
                  className="material-color-swatch" 
                  style={{ backgroundColor: material.color }}
                  title={material.name}
                />
                <span className="material-details">
                  {material.thickness}
                  {material.finish && ` • ${material.finish}`}
                </span>
              </>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
};

export default MaterialSelector;
