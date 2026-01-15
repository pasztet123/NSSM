import { useState, useEffect } from 'react';
import { Point, Segment, Unit, convertFromPixels, convertToPixels, getUnitLabel } from '../types';
import './PropertiesPanel.css';

interface PropertiesPanelProps {
  points: Point[];
  segments: Segment[];
  selectedPointId: string | null;
  selectedSegmentId: string | null;
  unit: Unit;
  onUpdatePointPosition: (id: string, x: number, y: number) => void;
  onUpdateSegmentLength: (id: string, length: number) => void;
  onDeletePoint: (id: string) => void;
  onDeleteSegment: (id: string) => void;
}

const PropertiesPanel = ({
  points,
  segments,
  selectedPointId,
  selectedSegmentId,
  unit,
  onUpdatePointPosition,
  onUpdateSegmentLength,
  onDeletePoint,
  onDeleteSegment,
}: PropertiesPanelProps) => {
  const selectedPoint = points.find(p => p.id === selectedPointId);
  const selectedSegment = segments.find(s => s.id === selectedSegmentId);

  const [editX, setEditX] = useState('');
  const [editY, setEditY] = useState('');
  const [editLength, setEditLength] = useState('');
  
  const unitLabel = getUnitLabel(unit);

  // Update edit fields when unit or selection changes
  useEffect(() => {
    setEditX('');
    setEditY('');
    setEditLength('');
  }, [unit, selectedPointId, selectedSegmentId]);

  const handleUpdatePoint = () => {
    if (selectedPoint && editX && editY) {
      const xPixels = convertToPixels(parseFloat(editX), unit);
      const yPixels = convertToPixels(parseFloat(editY), unit);
      onUpdatePointPosition(selectedPoint.id, xPixels, yPixels);
      setEditX('');
      setEditY('');
    }
  };

  const handleUpdateSegment = () => {
    if (selectedSegment && editLength) {
      const newLength = parseFloat(editLength);
      if (newLength > 0) {
        const lengthPixels = convertToPixels(newLength, unit);
        onUpdateSegmentLength(selectedSegment.id, lengthPixels);
        setEditLength('');
      }
    }
  };

  return (
    <div className="properties-panel">
      <h2>Properties</h2>

      {!selectedPoint && !selectedSegment && (
        <div className="no-selection">
          <p>Select a point or segment to view properties</p>
        </div>
      )}

      {selectedPoint && (
        <div className="property-section">
          <h3>Selected Point</h3>
          
          <div className="property-group">
            <label>Current Position</label>
            <div className="property-value">
              X: {convertFromPixels(selectedPoint.x, unit).toFixed(2)} {unitLabel}, 
              Y: {convertFromPixels(selectedPoint.y, unit).toFixed(2)} {unitLabel}
            </div>
          </div>

          <div className="property-group">
            <label>Edit Position ({unitLabel})</label>
            <div className="input-row">
              <input
                type="number"
                placeholder="X"
                value={editX}
                onChange={(e) => setEditX(e.target.value)}
                className="property-input"
              />
              <input
                type="number"
                placeholder="Y"
                value={editY}
                onChange={(e) => setEditY(e.target.value)}
                className="property-input"
              />
            </div>
            <button
              onClick={handleUpdatePoint}
              className="update-button"
              disabled={!editX || !editY}
            >
              Update Position
            </button>
          </div>

          <div className="property-group">
            <button
              onClick={() => selectedPoint && onDeletePoint(selectedPoint.id)}
              className="delete-button"
            >
              Delete Point
            </button>
          </div>
        </div>
      )}

      {selectedSegment && (
        <div className="property-section">
          <h3>Selected Segment</h3>
          
          <div className="property-group">
            <label>Current Length</label>
            <div className="property-value">
              {convertFromPixels(selectedSegment.length, unit).toFixed(2)} {unitLabel}
            </div>
          </div>

          <div className="property-group">
            <label>Edit Length ({unitLabel})</label>
            <input
              type="number"
              placeholder="New length"
              value={editLength}
              onChange={(e) => setEditLength(e.target.value)}
              className="property-input"
              min="0"
              step="0.1"
            />
            <button
              onClick={handleUpdateSegment}
              className="update-button"
              disabled={!editLength || parseFloat(editLength) <= 0}
            >
              Update Length
            </button>
          </div>

          <div className="property-group">
            <label>Connected Points</label>
            <div className="property-value">
              {(() => {
                const startPoint = points.find(p => p.id === selectedSegment.startPointId);
                const endPoint = points.find(p => p.id === selectedSegment.endPointId);
                return startPoint && endPoint
                  ? `(${convertFromPixels(startPoint.x, unit).toFixed(1)}, ${convertFromPixels(startPoint.y, unit).toFixed(1)}) → (${convertFromPixels(endPoint.x, unit).toFixed(1)}, ${convertFromPixels(endPoint.y, unit).toFixed(1)})`
                  : 'N/A';
              })()}
            </div>
          </div>

          <div className="property-group">
            <button
              onClick={() => selectedSegment && onDeleteSegment(selectedSegment.id)}
              className="delete-button"
            >
              Delete Segment
            </button>
          </div>
        </div>
      )}

      <div className="stats-section">
        <h3>Project Stats</h3>
        <div className="stat-item">
          <span className="stat-label">Total Points:</span>
          <span className="stat-value">{points.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Segments:</span>
          <span className="stat-value">{segments.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Length:</span>
          <span className="stat-value">
            {convertFromPixels(segments.reduce((sum, s) => sum + s.length, 0), unit).toFixed(2)} {unitLabel}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;
