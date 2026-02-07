import { Material } from '../types';
import './MaterialSelector.css';
import { useState } from 'react';

interface MaterialSelectorProps {
  materials: Material[];
  selectedMaterialId: string | undefined;
  onSelectMaterial: (materialId: string) => void;
  onUpdateMaterialProperties?: (materialId: string, thickness: number, kFactor: number) => void;
}

const MaterialSelector = ({ 
  materials, 
  selectedMaterialId, 
  onSelectMaterial,
  onUpdateMaterialProperties 
}: MaterialSelectorProps) => {
  const [editingThickness, setEditingThickness] = useState(false);
  const [editingKFactor, setEditingKFactor] = useState(false);
  const [tempThickness, setTempThickness] = useState<string>('');
  const [tempKFactor, setTempKFactor] = useState<string>('');

  const selectedMaterial = materials.find(m => m.id === selectedMaterialId);

  const handleThicknessClick = () => {
    if (selectedMaterial && onUpdateMaterialProperties) {
      setTempThickness(selectedMaterial.thicknessInches.toString());
      setEditingThickness(true);
    }
  };

  const handleKFactorClick = () => {
    if (selectedMaterial && onUpdateMaterialProperties) {
      setTempKFactor(selectedMaterial.kFactor.toString());
      setEditingKFactor(true);
    }
  };

  const handleThicknessBlur = () => {
    if (selectedMaterialId && onUpdateMaterialProperties && selectedMaterial) {
      const thickness = parseFloat(tempThickness);
      
      if (!isNaN(thickness) && thickness > 0 && thickness <= 0.25) {
        onUpdateMaterialProperties(selectedMaterialId, thickness, selectedMaterial.kFactor);
      }
    }
    setEditingThickness(false);
  };

  const handleKFactorBlur = () => {
    if (selectedMaterialId && onUpdateMaterialProperties && selectedMaterial) {
      const kFactor = parseFloat(tempKFactor);
      
      if (!isNaN(kFactor) && kFactor > 0 && kFactor < 1) {
        onUpdateMaterialProperties(selectedMaterialId, selectedMaterial.thicknessInches, kFactor);
      }
    }
    setEditingKFactor(false);
  };

  const handleThicknessKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleThicknessBlur();
    } else if (e.key === 'Escape') {
      setEditingThickness(false);
    }
  };

  const handleKFactorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleKFactorBlur();
    } else if (e.key === 'Escape') {
      setEditingKFactor(false);
    }
  };

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
      {selectedMaterialId && selectedMaterial && (
        <div className="material-info">
          <div 
            className="material-color-swatch" 
            style={{ backgroundColor: selectedMaterial.color }}
            title={selectedMaterial.name}
          />
          <span className="material-details">
            {selectedMaterial.thickness}
            {selectedMaterial.finish && ` • ${selectedMaterial.finish}`}
          </span>
          
          <div className="material-bend-info">
            <div className="bend-property">
              <span className="bend-label">Thickness:</span>
              {editingThickness ? (
                <input
                  className="bend-value-input"
                  type="number"
                  step="0.0001"
                  min="0.001"
                  max="0.25"
                  value={tempThickness}
                  onChange={(e) => setTempThickness(e.target.value)}
                  onBlur={handleThicknessBlur}
                  onKeyDown={handleThicknessKeyDown}
                  autoFocus
                />
              ) : (
                <span 
                  className="bend-value editable"
                  onClick={handleThicknessClick}
                  title="Click to edit"
                >
                  {selectedMaterial.thicknessInches.toFixed(4)}"
                </span>
              )}
            </div>
            <div className="bend-property">
              <span className="bend-label">K-Factor:</span>
              {editingKFactor ? (
                <input
                  className="bend-value-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="0.99"
                  value={tempKFactor}
                  onChange={(e) => setTempKFactor(e.target.value)}
                  onBlur={handleKFactorBlur}
                  onKeyDown={handleKFactorKeyDown}
                  autoFocus
                />
              ) : (
                <span 
                  className="bend-value editable"
                  onClick={handleKFactorClick}
                  title="Click to edit"
                >
                  {selectedMaterial.kFactor.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialSelector;
