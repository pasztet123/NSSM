import { useEffect, useRef, useState } from 'react';
import { Product } from '../types';
import './ProductBar.css';
import './ProductCatalogDropdown.css';

interface ProductCatalogDropdownProps {
  products: Product[];
  selectedProduct: Product | null;
  onSelectProduct: (product: Product) => void;
}

const ProductCatalogDropdown = ({
  products,
  selectedProduct,
  onSelectProduct,
}: ProductCatalogDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  return (
    <div ref={containerRef} className="product-catalog-dropdown">
      <button
        className="product-catalog-dropdown-toggle"
        onClick={() => setIsOpen(v => !v)}
        type="button"
      >
        <span className="product-catalog-dropdown-label">Product:</span>
        <span className="product-catalog-dropdown-value">
          {selectedProduct ? selectedProduct.name : 'Select product…'}
        </span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className={`product-catalog-dropdown-chevron ${isOpen ? 'open' : ''}`}
        >
          <polyline
            points="6 9 12 15 18 9"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="product-catalog-dropdown-panel">
          <div className="product-bar-header product-catalog-dropdown-header">
            <h3>Select a Product</h3>
            <p>Choose a flashing product to view and customize</p>
          </div>

          <div className="product-catalog-dropdown-content">
            <div className="product-tiles">
              {products.map(product => (
                <button
                  key={product.id}
                  className={`product-tile ${selectedProduct?.id === product.id ? 'active' : ''}`}
                  onClick={() => {
                    onSelectProduct(product);
                    setIsOpen(false);
                  }}
                  type="button"
                >
                  <div className="product-tile-image">
                    {product.images.length > 0 ? (
                      <img src={product.images[0]} alt={product.name} />
                    ) : (
                      <div className="product-tile-no-image">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                          <polyline points="21 15 16 10 5 21" strokeWidth="2" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="product-tile-content">
                    <h4>{product.name}</h4>
                    <p className="product-tile-category">{product.category}</p>
                    {(product.model3D || product.model3DId) && (
                      <div className="product-has-model" title="Has 3D model assigned">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path
                            d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <polyline
                            points="3.27 6.96 12 12.01 20.73 6.96"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <line x1="12" y1="22.08" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>3D Model</span>
                      </div>
                    )}
                  </div>

                  {selectedProduct?.id === product.id && (
                    <div className="product-tile-selected">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white">
                        <polyline points="20 6 9 17 4 12" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCatalogDropdown;
