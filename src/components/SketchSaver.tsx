import { useState } from 'react';
import { Point, Segment } from '../types';
import './SketchSaver.css';

interface SketchSaverProps {
  points: Point[];
  segments: Segment[];
  onSave: (name: string, description: string, category: string) => void;
  onClose: () => void;
}

const SketchSaver = ({ points, segments, onSave, onClose }: SketchSaverProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Custom');
  const [isSaving, setIsSaving] = useState(false);

  const categories = [
    'Custom',
    'Basic Shapes',
    'Flashing Profiles',
    'Drip Edges',
    'Caps',
    'Closures',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Please enter a name for the sketch');
      return;
    }

    if (points.length === 0 || segments.length === 0) {
      alert('Cannot save empty sketch. Please add some points and segments first.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(name.trim(), description.trim(), category);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="sketch-saver-overlay">
      <div className="sketch-saver">
        <div className="saver-header">
          <h2>Save 2D Sketch</h2>
          <button className="close-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="saver-content">
          <div className="sketch-info">
            <div className="info-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              </svg>
              <span>{points.length} points</span>
            </div>
            <div className="info-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="5" cy="12" r="2" fill="currentColor"/>
                <circle cx="19" cy="12" r="2" fill="currentColor"/>
              </svg>
              <span>{segments.length} segments</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="saver-form">
            <div className="form-group">
              <label htmlFor="sketch-name">
                Sketch Name <span className="required">*</span>
              </label>
              <input
                id="sketch-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter sketch name..."
                required
                disabled={isSaving}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="sketch-category">Category</label>
              <select
                id="sketch-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSaving}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="sketch-description">Description</label>
              <textarea
                id="sketch-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for this sketch..."
                rows={4}
                disabled={isSaving}
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={onClose}
                className="cancel-button"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="save-button"
                disabled={isSaving || !name.trim()}
              >
                {isSaving ? (
                  <>
                    <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" strokeWidth="3" strokeDasharray="32" strokeDashoffset="0">
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          from="0 12 12"
                          to="360 12 12"
                          dur="1s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="17 21 17 13 7 13 7 21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="7 3 7 8 15 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Save Sketch
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SketchSaver;
