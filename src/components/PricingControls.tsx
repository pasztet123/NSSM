import { Material, ProductType } from '../types';
import { PricingConfig } from '../data/pricingConfig';
import './PricingControls.css';

interface PricingControlsProps {
  selectedMaterial: Material | null;
  productType: ProductType;
  pricingConfig: PricingConfig;
  onUpdateMaterialPrice: (materialId: string, price: number) => void;
  onUpdateLaborCost: (productType: ProductType, cost: number) => void;
  onUpdateProfitMargin: (margin: number) => void;
}

const PricingControls = ({
  selectedMaterial,
  productType,
  pricingConfig,
  onUpdateMaterialPrice,
  onUpdateLaborCost,
  onUpdateProfitMargin,
}: PricingControlsProps) => {
  const laborCost = pricingConfig.laborCosts.find(lc => lc.productType === productType);

  const formatProductType = (type: ProductType): string => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="pricing-controls">
      <div className="pricing-controls-header">
        <h3>Pricing Configuration</h3>
      </div>
      
      <div className="pricing-controls-grid">
        {/* Material Price */}
        <div className="pricing-control-item">
          <label className="control-label">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
              <path d="M3 9h18M9 21V9" strokeWidth="2"/>
            </svg>
            Material Sheet Price
          </label>
          {selectedMaterial ? (
            <div className="control-input-wrapper">
              <span className="input-prefix">$</span>
              <input
                type="number"
                className="control-input"
                value={selectedMaterial.sheetPrice}
                onChange={(e) => {
                  const price = parseFloat(e.target.value);
                  if (!isNaN(price) && price > 0) {
                    onUpdateMaterialPrice(selectedMaterial.id, price);
                  }
                }}
                step="0.50"
                min="0"
              />
              <span className="input-suffix">
                / {selectedMaterial.sheetWidth}×{selectedMaterial.sheetLength}"
              </span>
            </div>
          ) : (
            <div className="control-placeholder">Select material first</div>
          )}
        </div>

        {/* Labor Cost */}
        <div className="pricing-control-item">
          <label className="control-label">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2"/>
              <circle cx="12" cy="7" r="4" strokeWidth="2"/>
            </svg>
            Labor Cost ({formatProductType(productType)})
          </label>
          <div className="control-input-wrapper">
            <span className="input-prefix">$</span>
            <input
              type="number"
              className="control-input"
              value={laborCost?.costPerUnit || 3}
              onChange={(e) => {
                const cost = parseFloat(e.target.value);
                if (!isNaN(cost) && cost >= 0) {
                  onUpdateLaborCost(productType, cost);
                }
              }}
              step="0.50"
              min="0"
            />
            <span className="input-suffix">/ flashing</span>
          </div>
        </div>

        {/* Profit Margin */}
        <div className="pricing-control-item">
          <label className="control-label">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="12" y1="1" x2="12" y2="23" strokeWidth="2"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeWidth="2"/>
            </svg>
            Profit Margin
          </label>
          <div className="control-input-wrapper">
            <input
              type="number"
              className="control-input"
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
            <span className="input-suffix">%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingControls;
