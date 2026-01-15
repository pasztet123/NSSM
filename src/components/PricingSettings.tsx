import { useState } from 'react';
import { Material, ProductType } from '../types';
import { PricingConfig } from '../data/pricingConfig';
import './PricingSettings.css';

interface PricingSettingsProps {
  materials: Material[];
  pricingConfig: PricingConfig;
  onUpdateMaterial: (materialId: string, updates: Partial<Material>) => void;
  onUpdateLaborCost: (productType: ProductType, cost: number) => void;
  onUpdateProfitMargin: (margin: number) => void;
  onClose: () => void;
}

const PricingSettings = ({
  materials,
  pricingConfig,
  onUpdateMaterial,
  onUpdateLaborCost,
  onUpdateProfitMargin,
  onClose,
}: PricingSettingsProps) => {
  const [editingMaterial, setEditingMaterial] = useState<string | null>(null);
  const [tempSheetPrice, setTempSheetPrice] = useState<{ [key: string]: string }>({});

  const handleMaterialPriceUpdate = (materialId: string) => {
    const price = parseFloat(tempSheetPrice[materialId]);
    if (!isNaN(price) && price > 0) {
      onUpdateMaterial(materialId, { sheetPrice: price });
      setEditingMaterial(null);
      setTempSheetPrice({ ...tempSheetPrice, [materialId]: '' });
    }
  };

  return (
    <div className="pricing-settings-overlay">
      <div className="pricing-settings">
        <div className="settings-header">
          <h2>Pricing Settings</h2>
          <button className="close-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="settings-content">
          {/* Material Prices */}
          <section className="settings-section">
            <h3>Material Prices (per sheet)</h3>
            <div className="materials-list">
              {materials.map((material) => (
                <div key={material.id} className="material-price-item">
                  <div className="material-info">
                    <div 
                      className="material-color" 
                      style={{ backgroundColor: material.color }}
                    />
                    <div>
                      <div className="material-name">{material.name}</div>
                      <div className="material-dimensions">
                        {material.sheetWidth}" × {material.sheetLength}" 
                        ({(material.sheetWidth / 12).toFixed(1)}' × {(material.sheetLength / 12).toFixed(0)}')
                      </div>
                    </div>
                  </div>
                  {editingMaterial === material.id ? (
                    <div className="price-edit">
                      <input
                        type="number"
                        value={tempSheetPrice[material.id] || material.sheetPrice}
                        onChange={(e) => setTempSheetPrice({ 
                          ...tempSheetPrice, 
                          [material.id]: e.target.value 
                        })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleMaterialPriceUpdate(material.id);
                          if (e.key === 'Escape') setEditingMaterial(null);
                        }}
                        autoFocus
                        step="0.01"
                        min="0"
                      />
                      <button 
                        className="save-button" 
                        onClick={() => handleMaterialPriceUpdate(material.id)}
                      >
                        ✓
                      </button>
                      <button 
                        className="cancel-button" 
                        onClick={() => setEditingMaterial(null)}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="price-display">
                      <span className="price">${material.sheetPrice.toFixed(2)}</span>
                      <button 
                        className="edit-button" 
                        onClick={() => {
                          setEditingMaterial(material.id);
                          setTempSheetPrice({ 
                            ...tempSheetPrice, 
                            [material.id]: material.sheetPrice.toString() 
                          });
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Labor Costs */}
          <section className="settings-section">
            <h3>Labor Costs (per flashing)</h3>
            <div className="labor-costs-list">
              {pricingConfig.laborCosts.map((laborCost) => (
                <div key={laborCost.productType} className="labor-cost-item">
                  <label className="labor-label">
                    {laborCost.productType.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </label>
                  <div className="labor-input-group">
                    <span className="currency">$</span>
                    <input
                      type="number"
                      value={laborCost.costPerUnit}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value);
                        if (!isNaN(cost) && cost >= 0) {
                          onUpdateLaborCost(laborCost.productType, cost);
                        }
                      }}
                      step="0.50"
                      min="0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Profit Margin */}
          <section className="settings-section">
            <h3>Profit Margin</h3>
            <div className="margin-control">
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={pricingConfig.profitMargin}
                onChange={(e) => onUpdateProfitMargin(parseFloat(e.target.value))}
                className="margin-slider"
              />
              <div className="margin-value">
                <input
                  type="number"
                  value={pricingConfig.profitMargin}
                  onChange={(e) => {
                    const margin = parseFloat(e.target.value);
                    if (!isNaN(margin) && margin >= 0 && margin <= 100) {
                      onUpdateProfitMargin(margin);
                    }
                  }}
                  step="1"
                  min="0"
                  max="100"
                />
                <span className="percent">%</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PricingSettings;
