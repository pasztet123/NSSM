import { Material, Segment, Point, Unit, ProductType } from '../types';
import { calculateProductPrice, formatPrice } from '../lib/priceCalculator';
import { PricingConfig } from '../data/pricingConfig';
import './PriceDisplay.css';

interface PriceDisplayProps {
  segments: Segment[];
  points: Point[];
  material: Material | null;
  productType: ProductType;
  pricingConfig: PricingConfig;
  unit: Unit;
  onUpdateMaterialPrice: (materialId: string, price: number) => void;
  onUpdateLaborCost: (productType: ProductType, cost: number) => void;
  onUpdateProfitMargin: (margin: number) => void;
}

const PriceDisplay = ({ 
  segments, 
  points, 
  material, 
  productType, 
  pricingConfig, 
  unit,
  onUpdateMaterialPrice,
  onUpdateLaborCost,
  onUpdateProfitMargin
}: PriceDisplayProps) => {
  const priceCalc = calculateProductPrice(segments, points, material, productType, pricingConfig, unit);
  const laborCost = pricingConfig.laborCosts.find(lc => lc.productType === productType);

  // Show empty state only if no material selected
  if (!material) {
    return (
      <div className="price-display empty">
        <div className="price-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="12" y1="1" x2="12" y2="23" strokeWidth="2" strokeLinecap="round"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="price-content">
          <div className="price-label">Pricing Calculator</div>
          <div className="price-value">--</div>
          <div className="price-hint">Select material to configure pricing</div>
        </div>
      </div>
    );
  }

  const hasDimensions = segments.length > 0 && points.length > 0;

  return (
    <div className="price-display">
      <div className="price-main-section">
        {/* LEFT SIDE: Pricing Controls Section */}
        <div className="pricing-controls-section">
          <h3 className="controls-heading">Pricing Controls</h3>
          <div className="price-inputs-grid">
            {/* Labor Cost Input */}
            <div className="price-input-cell">
              <label className="input-cell-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2"/>
                  <circle cx="12" cy="7" r="4" strokeWidth="2"/>
                </svg>
                Labor
              </label>
              <div className="input-cell-value">
                <span className="value-prefix">$</span>
                <input
                  type="number"
                  className="price-input"
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
                <span className="value-suffix">/ unit</span>
              </div>
            </div>

            {/* Material Price Input */}
            <div className="price-input-cell">
              <label className="input-cell-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
                  <path d="M3 9h18M9 21V9" strokeWidth="2"/>
                </svg>
                Material
              </label>
              <div className="input-cell-value">
                <span className="value-prefix">$</span>
                <input
                  type="number"
                  className="price-input"
                  value={material.sheetPrice}
                  onChange={(e) => {
                    const price = parseFloat(e.target.value);
                    if (!isNaN(price) && price > 0) {
                      onUpdateMaterialPrice(material.id, price);
                    }
                  }}
                  step="0.50"
                  min="0"
                />
                <span className="value-suffix">/sheet</span>
              </div>
            </div>

            {/* Profit Margin Input */}
            <div className="price-input-cell">
              <label className="input-cell-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Profit
              </label>
              <div className="input-cell-value">
                <input
                  type="number"
                  className="price-input"
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
                <span className="value-suffix">%</span>
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="price-breakdown">
            <div className="breakdown-row">
              <span className="breakdown-label">Material:</span>
              <span className="breakdown-value">
                {hasDimensions ? formatPrice(priceCalc.materialCost) : '--'}
              </span>
            </div>
            <div className="breakdown-row">
              <span className="breakdown-label">Labor:</span>
              <span className="breakdown-value">
                {hasDimensions ? formatPrice(priceCalc.laborCost) : '--'}
              </span>
            </div>
            <div className="breakdown-row">
              <span className="breakdown-label">Subtotal:</span>
              <span className="breakdown-value">
                {hasDimensions ? formatPrice(priceCalc.subtotal) : '--'}
              </span>
            </div>
            <div className="breakdown-row highlight">
              <span className="breakdown-label">Margin ({priceCalc.profitMargin}%):</span>
              <span className="breakdown-value">
                {hasDimensions ? '+' + formatPrice(priceCalc.profitAmount) : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Total Price & Technical Details */}
        <div className="price-header-section">
          {/* Total Price Display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px', backdropFilter: 'blur(10px)' }}>
            <div className="price-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="12" y1="1" x2="12" y2="23" strokeWidth="2" strokeLinecap="round"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div className="price-label">Total Price</div>
              <div className="price-value">
                {hasDimensions ? formatPrice(priceCalc.totalCost) : '--'}
              </div>
              {!hasDimensions && (
                <div className="price-hint-small">Draw dimensions to calculate price</div>
              )}
            </div>
          </div>

          {/* Technical Details - only show when dimensions exist */}
          {hasDimensions && (
            <div className="price-details">
              <div className="detail-item">
                <span className="detail-icon">📏</span>
                <span>Length: {priceCalc.requiredWidth.toFixed(1)}" → {priceCalc.chargedWidth.toFixed(1)}"</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon">📐</span>
                <span>Strip: {priceCalc.chargedWidth.toFixed(1)}" × {priceCalc.stripLength}'</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon">📊</span>
                <span>Sheet: {(priceCalc.sheetFraction * 100).toFixed(1)}% ({priceCalc.chargedWidth}/{material.sheetWidth})</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceDisplay;
