import { useState } from 'react';
import { Product } from '../types';
import './ProductBar.css';

interface ProductBarProps {
  products: Product[];
  selectedProduct: Product | null;
  onSelectProduct: (product: Product) => void;
}

const ProductBar = ({ products, selectedProduct, onSelectProduct }: ProductBarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`product-bar ${isExpanded ? 'expanded' : ''}`}>
      {/* Toggle Button */}
      <button 
        className="product-bar-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="18 15 12 9 6 15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>
          {isExpanded ? 'Close' : 'Browse'} Product Catalog
          {selectedProduct && !isExpanded && ` - ${selectedProduct.name}`}
        </span>
      </button>

      {/* Expanded Product Grid */}
      {isExpanded && (
        <div className="product-bar-content">
          <div className="product-bar-header">
            <h3>Select a Product</h3>
            <p>Choose a flashing product to view and customize</p>
          </div>
          
          <div className="product-tiles">
            {products.map((product) => (
              <button
                key={product.id}
                className={`product-tile ${selectedProduct?.id === product.id ? 'active' : ''}`}
                onClick={() => {
                  onSelectProduct(product);
                  setIsExpanded(false);
                }}
              >
                <div className="product-tile-image">
                  {product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.name} />
                  ) : (
                    <div className="product-tile-no-image">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                        <polyline points="21 15 16 10 5 21" strokeWidth="2"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="product-tile-content">
                  <h4>{product.name}</h4>
                  <p className="product-tile-category">{product.category}</p>
                  <p className="product-tile-price">${product.basePrice}/ft</p>
                </div>
                {selectedProduct?.id === product.id && (
                  <div className="product-tile-selected">
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

export default ProductBar;
