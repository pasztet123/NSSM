import { Material, Segment, Point, Unit, ProductType } from '../types';
import { calculateProductPrice, formatPrice } from '../lib/priceCalculator';
import { PricingConfig } from '../data/pricingConfig';
import { useState, useEffect, useMemo } from 'react';
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
  onUpdateSetupFee: (fee: number) => void;
  onUpdateQuantity: (quantity: number) => void;
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
  onUpdateProfitMargin,
  onUpdateSetupFee,
  onUpdateQuantity
}: PriceDisplayProps) => {
  const [showControls, setShowControls] = useState(false);
  const [tempQuantity, setTempQuantity] = useState<string>(pricingConfig.quantity.toString());
  
  const priceCalc = useMemo(() => 
    calculateProductPrice(segments, points, material, productType, pricingConfig, unit),
    [segments, points, material, productType, pricingConfig, unit]
  );
  
  const laborCost = pricingConfig.laborCosts.find(lc => lc.productType === productType);

  const hasDimensions = segments.length > 0 && points.length > 0;
  const isWidthExceeded = hasDimensions && !!priceCalc.isWidthExceeded;

  // Sync tempQuantity with pricingConfig.quantity when it changes externally
  useEffect(() => {
    setTempQuantity(pricingConfig.quantity.toString());
  }, [pricingConfig.quantity]);

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

  return (
    <div className="price-display">
      <div className="price-main-layout">
        {/* LEFT SIDE: Collapsible Pricing Controls + Technical Details */}
        <div className="left-column">
          <div className="pricing-controls-collapsible">
            <button 
              className="controls-toggle"
              onClick={() => setShowControls(!showControls)}
            >
              <span>Pricing Controls</span>
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor"
                style={{ transform: showControls ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
              >
                <polyline points="6 9 12 15 18 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            {showControls && (
              <div className="pricing-controls-section">
              <div className="price-inputs-grid">
                {/* Quantity Input */}
                <div className="price-input-cell">
                  <label className="input-cell-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="7" height="7" strokeWidth="2"/>
                      <rect x="14" y="3" width="7" height="7" strokeWidth="2"/>
                      <rect x="14" y="14" width="7" height="7" strokeWidth="2"/>
                      <rect x="3" y="14" width="7" height="7" strokeWidth="2"/>
                    </svg>
                    Quantity
                  </label>
                  <div className="input-cell-value">
                    <input
                      type="number"
                      className="price-input"
                      value={tempQuantity}
                      onChange={(e) => {
                        setTempQuantity(e.target.value);
                        const qty = parseInt(e.target.value);
                        if (!isNaN(qty) && qty >= 1) {
                          onUpdateQuantity(qty);
                        }
                      }}
                      onBlur={() => {
                        const qty = parseInt(tempQuantity);
                        if (isNaN(qty) || qty < 1) {
                          setTempQuantity('1');
                          onUpdateQuantity(1);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const qty = parseInt(tempQuantity);
                          if (!isNaN(qty) && qty >= 1) {
                            onUpdateQuantity(qty);
                          }
                          e.currentTarget.blur();
                        }
                      }}
                      step="1"
                      min="1"
                      inputMode="numeric"
                    />
                    <span className="value-suffix">units</span>
                  </div>
                </div>

                {/* Setup Fee Input */}
                <div className="price-input-cell">
                  <label className="input-cell-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                      <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Setup Fee
                  </label>
                  <div className="input-cell-value">
                    <span className="value-prefix">$</span>
                    <input
                      type="number"
                      className="price-input"
                      value={pricingConfig.setupFee}
                      onChange={(e) => {
                        const fee = parseFloat(e.target.value);
                        if (!isNaN(fee) && fee >= 0) {
                          onUpdateSetupFee(fee);
                        }
                      }}
                      step="1"
                      min="0"
                    />
                    <span className="value-suffix">{pricingConfig.quantity > 10 ? '(waived)' : '(one-time)'}</span>
                  </div>
                </div>

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
                  <span className="breakdown-label">Material (per unit):</span>
                  <span className="breakdown-value">
                    {hasDimensions ? formatPrice(priceCalc.materialCost) : '--'}
                  </span>
                </div>
                <div className="breakdown-row">
                  <span className="breakdown-label">Labor (per unit):</span>
                  <span className="breakdown-value">
                    {hasDimensions ? formatPrice(priceCalc.laborCost) : '--'}
                  </span>
                </div>
                <div className="breakdown-row">
                  <span className="breakdown-label">Quantity:</span>
                  <span className="breakdown-value">
                    {priceCalc.quantity} {priceCalc.quantity === 1 ? 'unit' : 'units'}
                  </span>
                </div>
                {priceCalc.setupFee > 0 && (
                  <div className="breakdown-row">
                    <span className="breakdown-label">Setup Fee:</span>
                    <span className="breakdown-value">
                      {formatPrice(priceCalc.setupFee)}
                    </span>
                  </div>
                )}
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
          )}
        </div>

        {/* Technical Details - below pricing controls */}
        {hasDimensions && (
          <div className="price-details-horizontal">
            <div className="detail-item">
              <span>
                Length: {priceCalc.requiredWidth.toFixed(1)}"
                {isWidthExceeded
                  ? ` (max ${priceCalc.maxAllowedWidth.toFixed(1)}")`
                  : ` → ${priceCalc.chargedWidth.toFixed(1)}"`}
              </span>
            </div>
            <div className="detail-item">
              <span>Strip: {priceCalc.chargedWidth.toFixed(1)}" × {priceCalc.stripLength}'</span>
            </div>
            <div className="detail-item">
              <span>Sheet: {(priceCalc.sheetFraction * 100).toFixed(1)}% ({priceCalc.chargedWidth}/{material.sheetWidth})</span>
            </div>
          </div>
        )}
      </div>

        {/* RIGHT SIDE: Price Display - Shows unit price when closed, both when open */}
        <div className="price-header-section">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.6rem', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
            {/* When controls are CLOSED - show only Unit Price (large) */}
            {!showControls && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem' }}>
                <div className="price-icon">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="7" height="7" strokeWidth="2"/>
                    <rect x="14" y="3" width="7" height="7" strokeWidth="2"/>
                    <rect x="14" y="14" width="7" height="7" strokeWidth="2"/>
                    <rect x="3" y="14" width="7" height="7" strokeWidth="2"/>
                  </svg>
                </div>
                <div>
                  <div className="price-label">Unit Price</div>
                  <div className="price-value-large">
                    {hasDimensions ? formatPrice(priceCalc.totalCostPerUnit) : '--'}
                  </div>
                  {!hasDimensions && (
                    <div className="price-hint-small">Draw dimensions to calculate price</div>
                  )}
                </div>
              </div>
            )}
            
            {/* When controls are OPEN - show both Total Price (large) and Unit Price (small) */}
            {showControls && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem' }}>
                  <div className="price-icon">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="12" y1="1" x2="12" y2="23" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="price-label">Total Price</div>
                    <div className="price-value-large">
                      {hasDimensions ? formatPrice(priceCalc.totalCost) : '--'}
                    </div>
                    {!hasDimensions && (
                      <div className="price-hint-small">Draw dimensions to calculate price</div>
                    )}
                  </div>
                </div>
                
                {/* Unit Price when open - always show */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                  <div className="price-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="7" height="7" strokeWidth="2"/>
                      <rect x="14" y="3" width="7" height="7" strokeWidth="2"/>
                      <rect x="14" y="14" width="7" height="7" strokeWidth="2"/>
                      <rect x="3" y="14" width="7" height="7" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div>
                    <div className="price-label" style={{ fontSize: '0.95rem' }}>Unit Price</div>
                    <div className="price-value-small">
                      {hasDimensions ? formatPrice(priceCalc.totalCostPerUnit) : '--'}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default PriceDisplay;
