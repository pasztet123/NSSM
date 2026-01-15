import { Segment, Unit, convertFromPixels, getUnitLabel } from '../types';
import './DimensionPanel.css';

interface DimensionPanelProps {
  segments: Segment[];
  selectedSegmentId: string | null;
  unit: Unit;
  onUpdateSegmentLength: (id: string, length: number) => void;
  onUpdateSegmentAngle: (id: string, angle: number) => void;
  onDeleteSegment: (id: string) => void;
}

const DimensionPanel = ({
  segments,
  selectedSegmentId,
  unit,
  onUpdateSegmentLength,
  onUpdateSegmentAngle,
  onDeleteSegment,
}: DimensionPanelProps) => {
  const unitLabel = getUnitLabel(unit);

  // Calculate total length
  const totalLength = segments.reduce((sum, segment) => {
    return sum + convertFromPixels(segment.length, unit);
  }, 0);

  return (
    <div className="dimension-panel">
      <div className="dimension-panel-header">
        <h3>Product Dimensions</h3>
      </div>

      <div className="dimension-summary">
        <div className="summary-item total">
          <span className="summary-label">Total sheet metal length:</span>
          <span className="summary-value">{totalLength.toFixed(2)} {unitLabel}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Number of segments:</span>
          <span className="summary-value">{segments.length}</span>
        </div>
      </div>

      <div className="segments-list">
        <h4>Segments</h4>
        {segments.length === 0 ? (
          <p className="empty-message">No segments. Add points or segments on the 2D canvas.</p>
        ) : (
          segments.map((segment, index) => {
            const label = segment.label || String.fromCharCode(65 + index);
            const lengthInUnits = convertFromPixels(segment.length, unit);
            const isSelected = segment.id === selectedSegmentId;

            return (
              <div 
                key={segment.id} 
                className={`segment-item ${isSelected ? 'selected' : ''}`}
              >
                <div className="segment-header">
                  <span className="segment-label">{label}</span>
                  <button
                    className="delete-segment-btn"
                    onClick={() => onDeleteSegment(segment.id)}
                    title="Delete segment"
                  >
                    ×
                  </button>
                </div>
                
                <div className="segment-controls">
                  <div className="control-group">
                    <label>Length ({unitLabel}):</label>
                    <input
                      type="number"
                      value={lengthInUnits.toFixed(2)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value > 0) {
                          onUpdateSegmentLength(segment.id, value);
                        }
                      }}
                      step="0.1"
                      min="0.1"
                    />
                  </div>

                  {segment.angle !== undefined && (
                    <div className="control-group">
                      <label>Angle (°):</label>
                      <input
                        type="number"
                        value={segment.angle.toFixed(1)}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (!isNaN(value)) {
                            onUpdateSegmentAngle(segment.id, value);
                          }
                        }}
                        step="1"
                        min="-180"
                        max="180"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="dimension-info">
        <h4>Information</h4>
        <p>💡 Total dimensions determine the amount of sheet metal needed to manufacture the element.</p>
        <p>📐 Click on a segment to select and edit it.</p>
      </div>
    </div>
  );
};

export default DimensionPanel;
