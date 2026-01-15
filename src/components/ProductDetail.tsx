import { Product } from '../types';
import './ProductDetail.css';

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const ProductDetail = ({ product, onClose, onEdit, onDelete }: ProductDetailProps) => {
  return (
    <div className="product-detail-overlay" onClick={onClose}>
      <div className="product-detail" onClick={(e) => e.stopPropagation()}>
        <div className="product-detail-header">
          <div>
            <h2>{product.name}</h2>
            <p className="product-detail-category">{product.category}</p>
          </div>
          <button className="close-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="product-detail-content">
          {/* Images Section */}
          <div className="product-images-section">
            <div className="main-image">
              {product.images.length > 0 ? (
                <img src={product.images[0]} alt={product.name} />
              ) : (
                <div className="no-image-large">No Image Available</div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="thumbnail-images">
                {product.images.map((image, index) => (
                  <img key={index} src={image} alt={`${product.name} ${index + 1}`} />
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="product-info-section">
            <div className="pricing-section">
              <div className="price-card">
                <span className="price-label">Base Price</span>
                <span className="price-value">
                  ${product.basePrice.toFixed(2)} / ft
                </span>
                <span className="price-note">Price per linear foot</span>
              </div>
            </div>

            <div className="description-section">
              <h3>Description</h3>
              <p>{product.description}</p>
              {product.longDescription && (
                <p className="long-description">{product.longDescription}</p>
              )}
            </div>

            <div className="specifications-section">
              <h3>Specifications</h3>
              <table className="specs-table">
                <tbody>
                  {Object.entries(product.specifications).map(([key, value]) => (
                    value && (
                      <tr key={key}>
                        <td className="spec-label">{key.charAt(0).toUpperCase() + key.slice(1)}</td>
                        <td className="spec-value">{value}</td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>

            {(onEdit || onDelete) && (
              <div className="product-actions">
                {onEdit && (
                  <button className="edit-button" onClick={onEdit}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Edit Product
                  </button>
                )}
                {onDelete && (
                  <button className="delete-button" onClick={onDelete}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="3 6 5 6 21 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Delete Product
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
