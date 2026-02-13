import { Segment, Unit, convertFromPixels, getUnitLabel, calculateBendAllowance } from '../types';
import PDFExportButton from './PDFExportButton';
import './DimensionPanel.css';

interface DimensionPanelProps {
  segments: Segment[];
  selectedSegmentId: string | null;
  unit: Unit;
  points?: any[];
  projectName?: string;
  materialInfo?: string;
  thickness?: number;
  kFactor?: number;
  maxAllowedWidthInches?: number;
  onUpdateSegmentLength: (id: string, length: number) => void;
  onUpdateSegmentAngle: (id: string, angle: number) => void;
  onDeleteSegment: (id: string) => void;
  onUpdateBendAngle?: (pointId: string, newAngle: number, segAId: string, segBId: string) => void;
}

const DimensionPanel = ({
  segments,
  selectedSegmentId,
  unit,
  points = [],
  projectName,
  materialInfo,
  thickness,
  kFactor,
  maxAllowedWidthInches,
  onUpdateSegmentLength,
  onUpdateSegmentAngle,
  onDeleteSegment,
  onUpdateBendAngle,
}: DimensionPanelProps) => {
  const unitLabel = getUnitLabel(unit);

  type PointLike = { id: string; x: number; y: number };

  // Detect bends by graph connectivity (works even if segments array isn't ordered)
  const bends = (() => {
    if (!points || points.length === 0 || segments.length < 2) return [] as Array<{
      pointId: string;
      angle: number;
      segA: Segment;
      segB: Segment;
    }>;

    const pointsById = new Map<string, PointLike>();
    for (const p of points as any[]) {
      if (p && typeof p.id === 'string' && typeof p.x === 'number' && typeof p.y === 'number') {
        pointsById.set(p.id, p);
      }
    }

    const segmentsByPoint = new Map<string, Segment[]>();
    const addSegmentToPoint = (pointId: string, seg: Segment) => {
      const existing = segmentsByPoint.get(pointId);
      if (existing) {
        existing.push(seg);
      } else {
        segmentsByPoint.set(pointId, [seg]);
      }
    };

    for (const seg of segments) {
      addSegmentToPoint(seg.startPointId, seg);
      addSegmentToPoint(seg.endPointId, seg);
    }

    const angleBetween = (v1: { x: number; y: number }, v2: { x: number; y: number }) => {
      const mag1 = Math.hypot(v1.x, v1.y);
      const mag2 = Math.hypot(v2.x, v2.y);
      if (mag1 === 0 || mag2 === 0) return null;
      const dot = v1.x * v2.x + v1.y * v2.y;
      let cos = dot / (mag1 * mag2);
      cos = Math.max(-1, Math.min(1, cos));
      return (Math.acos(cos) * 180) / Math.PI;
    };

    const vectorForSegmentAtPoint = (seg: Segment, atPointId: string) => {
      const at = pointsById.get(atPointId);
      if (!at) return null;
      const otherId = seg.startPointId === atPointId ? seg.endPointId : seg.startPointId;
      const other = pointsById.get(otherId);
      if (!other) return null;
      return { x: other.x - at.x, y: other.y - at.y };
    };

    const result: Array<{ pointId: string; angle: number; segA: Segment; segB: Segment }> = [];
    for (const [pointId, connected] of segmentsByPoint.entries()) {
      // For a typical profile bend vertex has exactly 2 connected segments
      if (connected.length !== 2) continue;
      const v1 = vectorForSegmentAtPoint(connected[0], pointId);
      const v2 = vectorForSegmentAtPoint(connected[1], pointId);
      if (!v1 || !v2) continue;
      const angle = angleBetween(v1, v2);
      if (angle === null) continue;
      if (angle <= 0.001 || angle >= 179.999) continue;
      result.push({ pointId, angle, segA: connected[0], segB: connected[1] });
    }

    return result;
  })();

  // Calculate total length including bend allowance
  const totalLength = segments.reduce((sum, segment) => {
    return sum + convertFromPixels(segment.length, unit);
  }, 0);

  // Calculate dimensions for horizontal and vertical segments
  let horizontalLength = 0;
  let verticalLength = 0;
  segments.forEach(segment => {
    const length = convertFromPixels(segment.length, unit);
    const angle = segment.angle || 0;
    const normalizedAngle = ((angle % 360) + 360) % 360;
    
    // Consider horizontal if angle is close to 0° or 180°
    // Consider vertical if angle is close to 90° or 270°
    if ((normalizedAngle >= 0 && normalizedAngle < 45) || 
        (normalizedAngle >= 135 && normalizedAngle < 225) ||
        (normalizedAngle >= 315 && normalizedAngle < 360)) {
      horizontalLength += length;
    } else if ((normalizedAngle >= 45 && normalizedAngle < 135) ||
               (normalizedAngle >= 225 && normalizedAngle < 315)) {
      verticalLength += length;
    }
  });

  // Add bend allowance if thickness and kFactor are provided
  let totalBendAllowance = 0;
  let totalInnerArcLength = 0;
  let totalOuterArcLength = 0;
  const numberOfBends = bends.length;
  
  if (thickness && kFactor && bends.length > 0) {
    // thickness is already in inches, convert to current unit when needed
    let thicknessInCurrentUnit = thickness;
    if (unit === 'mm') {
      thicknessInCurrentUnit = thickness * 25.4;
    }

    for (const bendInfo of bends) {
      const bend = calculateBendAllowance(bendInfo.angle, thicknessInCurrentUnit, kFactor);
      totalBendAllowance += bend.bendAllowance;
      totalInnerArcLength += bend.innerLength;
      totalOuterArcLength += bend.outerLength;
    }
  }

  const totalWithBends = totalLength + totalBendAllowance;
  const bendAllowanceDifference = totalBendAllowance;

  const developedLengthInches = unit === 'inch' ? totalWithBends : totalWithBends / 25.4;
  const isWidthExceeded =
    typeof maxAllowedWidthInches === 'number' &&
    maxAllowedWidthInches > 0 &&
    developedLengthInches > maxAllowedWidthInches + 1e-6;
  
  // Calculate actual sheet metal length on inner and outer surfaces
  // For flat portions, length is the same on all surfaces
  // For bends, we use the arc lengths calculated above
  const sheetLengthInner = totalLength + totalInnerArcLength;
  const sheetLengthOuter = totalLength + totalOuterArcLength;
  const innerOuterDifference = totalOuterArcLength - totalInnerArcLength;

  return (
    <div className="dimension-panel">
      <div className="dimension-panel-header">
        <h3>Product Dimensions</h3>
      </div>

      <div className="dimension-summary">
        <div className="summary-item total">
          <span className="summary-label">Sheet metal length (neutral axis):</span>
          <span className="summary-value">{totalWithBends.toFixed(3)} {unitLabel}</span>
        </div>
        {isWidthExceeded && (
          <div className="summary-item highlight-strong">
            <span className="summary-label">⚠️ Exceeds max sheet width:</span>
            <span className="summary-value">{developedLengthInches.toFixed(2)}" &gt; {maxAllowedWidthInches!.toFixed(0)}"</span>
          </div>
        )}
        {thickness && kFactor && segments.length > 1 && (
          <>
            <div className="summary-item highlight">
              <span className="summary-label">📏 Inner surface length (compression):</span>
              <span className="summary-value">{sheetLengthInner.toFixed(3)} {unitLabel}</span>
            </div>
            <div className="summary-item highlight">
              <span className="summary-label">📏 Outer surface length (tension):</span>
              <span className="summary-value">{sheetLengthOuter.toFixed(3)} {unitLabel}</span>
            </div>
            <div className="summary-item highlight-strong">
              <span className="summary-label">⚡ Stretch difference (outer - inner):</span>
              <span className="summary-value">{innerOuterDifference.toFixed(3)} {unitLabel}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Bend allowance total:</span>
              <span className="summary-value">{bendAllowanceDifference.toFixed(3)} {unitLabel}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Bends detected:</span>
              <span className="summary-value">{numberOfBends}</span>
            </div>
          </>
        )}
        <div className="summary-item">
          <span className="summary-label">Theoretical length (flat):</span>
          <span className="summary-value">{totalLength.toFixed(3)} {unitLabel}</span>
        </div>
        {(horizontalLength > 0 || verticalLength > 0) && (
          <>
            <div className="summary-item">
              <span className="summary-label">Horizontal segments:</span>
              <span className="summary-value">{horizontalLength.toFixed(3)} {unitLabel}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Vertical segments:</span>
              <span className="summary-value">{verticalLength.toFixed(3)} {unitLabel}</span>
            </div>
          </>
        )}
        <div className="summary-item">
          <span className="summary-label">Number of segments:</span>
          <span className="summary-value">{segments.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Number of bends:</span>
          <span className="summary-value">{numberOfBends}</span>
        </div>
      </div>

      <div className="segments-list">
        <h4>Segments</h4>
        {segments.length === 0 ? (
          <p className="empty-message">No segments. Add points or segments on the 2D canvas.</p>
        ) : (
          <div className="segments-grid">
            {segments.map((segment, index) => {
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
          })}
          </div>
        )}
      </div>

      {/* Bend Angles */}
      {segments.length > 1 && points && points.length > 0 && (
        <div className="segments-list">
          <h4>Bend Angles</h4>
          <div className="bend-angles-grid">
            {bends.length === 0 ? (
              <div className="bend-angle-item">
                <span className="bend-label">No bends detected</span>
                <span className="bend-value">—</span>
              </div>
            ) : (
              bends.map((bendInfo, index) => {
                const labelA = bendInfo.segA.label || `S${segments.findIndex(s => s.id === bendInfo.segA.id) + 1}`;
                const labelB = bendInfo.segB.label || `S${segments.findIndex(s => s.id === bendInfo.segB.id) + 1}`;

                return (
                  <div key={`bend-${bendInfo.pointId}-${index}`} className="bend-angle-item">
                    <span className="bend-label">{labelA} ↔ {labelB}:</span>
                    {onUpdateBendAngle ? (
                      <input
                        type="number"
                        className="bend-angle-input"
                        value={bendInfo.angle.toFixed(1)}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (!isNaN(value) && value > 0 && value < 180) {
                            onUpdateBendAngle(bendInfo.pointId, value, bendInfo.segA.id, bendInfo.segB.id);
                          }
                        }}
                        step="0.1"
                        min="0.1"
                        max="179.9"
                      />
                    ) : (
                      <span className="bend-value">{bendInfo.angle.toFixed(1)}°</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* PDF Export Button */}
      <div style={{ padding: '1rem 0', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'center' }}>
        <PDFExportButton
          points={points}
          segments={segments}
          unit={unit}
          projectName={projectName}
          materialInfo={materialInfo}
          thickness={thickness}
          disabled={isWidthExceeded}
          disabledTitle={
            isWidthExceeded
              ? `Cannot export: developed length exceeds max width (${maxAllowedWidthInches?.toFixed(0)}")`
              : undefined
          }
        />
      </div>
    </div>
  );
};

export default DimensionPanel;
