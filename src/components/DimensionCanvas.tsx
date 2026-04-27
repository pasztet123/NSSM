import { useRef, useEffect, useState } from 'react';
import { Point, Segment, Unit, EditMode, Material, convertFromPixels, getUnitLabel, getGridSize, calculateBendAllowance } from '../types';
import './DimensionCanvas.css';

interface DimensionCanvasProps {
  viewResetKey?: number;
  points: Point[];
  segments: Segment[];
  selectedPointId: string | null;
  selectedSegmentId: string | null;
  mode: 'select' | 'addPoint' | 'addSegment';
  editMode?: EditMode;
  unit: Unit;
  material?: Material | null;
  onAddPoint: (x: number, y: number) => void;
  onAddSegment: (startPointId: string, endPointId: string) => void;
  onSelectPoint: (id: string | null) => void;
  onSelectSegment: (id: string | null) => void;
  onUpdatePointPosition: (id: string, x: number, y: number) => void;
  onUpdateSegmentAngle: (id: string, angle: number) => void;
  onRotateShape: (angle: number) => void;
  onMergePoints?: (sourcePointId: string, targetPointId: string) => void;
}

interface AngleLabelHitbox {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ConnectedBend {
  point: Point;
  angle: number;
  segA: Segment;
  segB: Segment;
}

const DimensionCanvas = ({
  viewResetKey = 0,
  points,
  segments,
  selectedPointId,
  selectedSegmentId,
  mode,
  editMode,
  unit,
  material,
  onAddPoint,
  onAddSegment,
  onSelectPoint,
  onSelectSegment,
  onUpdatePointPosition,
  onUpdateSegmentAngle,
  onRotateShape,
  onMergePoints,
}: DimensionCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleLabelHitboxesRef = useRef<AngleLabelHitbox[]>([]);
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [tempSegmentStart, setTempSegmentStart] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.5);
  const [showBackgroundControls, setShowBackgroundControls] = useState(false);
  const [showDimensions, setShowDimensions] = useState(false);
  const [showAngles, setShowAngles] = useState(false);
  const [alternateAngleLabels, setAlternateAngleLabels] = useState<Record<string, boolean>>({});
  
  // Future use for rotation and angle editing
  void onUpdateSegmentAngle;
  void onRotateShape;

  const POINT_RADIUS = 8;
  const gridSize = getGridSize(unit);
  const unitLabel = getUnitLabel(unit);

  const getAngleLabelKey = (segment: Segment, nextSegment: Segment, commonPointId: string): string => {
    const [firstSegmentId, secondSegmentId] = [segment.id, nextSegment.id].sort();
    return `${firstSegmentId}:${secondSegmentId}:${commonPointId}`;
  };

  const getDisplayedAngle = (angle: number, angleKey: string): number => {
    if (!alternateAngleLabels[angleKey]) {
      return angle;
    }

    const alternateAngle = 360 - angle;
    return alternateAngle >= 360 ? 0 : alternateAngle;
  };

  const calculateAngle = (x1: number, y1: number, x2: number, y2: number): number => {
    const radians = Math.atan2(y2 - y1, x2 - x1);
    return radians * (180 / Math.PI);
  };

  const getOtherPointForSegmentAtPoint = (segment: Segment, pointId: string): Point | null => {
    const otherPointId = segment.startPointId === pointId ? segment.endPointId : segment.startPointId;
    return points.find((point) => point.id === otherPointId) ?? null;
  };

  // Get angle between two segments
  const getAngleBetweenSegments = (seg1: Segment, seg2: Segment): number | null => {
    // Find common point
    let commonPointId: string | null = null;
    if (seg1.endPointId === seg2.startPointId) {
      commonPointId = seg1.endPointId;
    } else if (seg1.startPointId === seg2.endPointId) {
      commonPointId = seg1.startPointId;
    } else if (seg1.endPointId === seg2.endPointId || seg1.startPointId === seg2.startPointId) {
      return null; // Segments don't connect properly
    }

    if (!commonPointId) return null;

    const p1 = seg1.startPointId === commonPointId 
      ? points.find(p => p.id === seg1.endPointId)
      : points.find(p => p.id === seg1.startPointId);
    const common = points.find(p => p.id === commonPointId);
    const p2 = seg2.startPointId === commonPointId
      ? points.find(p => p.id === seg2.endPointId)
      : points.find(p => p.id === seg2.startPointId);

    if (!p1 || !common || !p2) return null;

    const angle1 = calculateAngle(common.x, common.y, p1.x, p1.y);
    const angle2 = calculateAngle(common.x, common.y, p2.x, p2.y);
    
    let diff = angle2 - angle1;
    if (diff < 0) diff += 360;
    if (diff > 360) diff -= 360;
    
    return diff;
  };

  const connectedBends: ConnectedBend[] = (() => {
    if (points.length === 0 || segments.length < 2) {
      return [];
    }

    const pointsById = new Map(points.map((point) => [point.id, point]));
    const segmentsByPoint = new Map<string, Segment[]>();

    const addSegmentToPoint = (pointId: string, segment: Segment) => {
      const existingSegments = segmentsByPoint.get(pointId);
      if (existingSegments) {
        existingSegments.push(segment);
      } else {
        segmentsByPoint.set(pointId, [segment]);
      }
    };

    for (const segment of segments) {
      addSegmentToPoint(segment.startPointId, segment);
      addSegmentToPoint(segment.endPointId, segment);
    }

    const angleBetweenVectors = (firstVector: { x: number; y: number }, secondVector: { x: number; y: number }) => {
      const firstMagnitude = Math.hypot(firstVector.x, firstVector.y);
      const secondMagnitude = Math.hypot(secondVector.x, secondVector.y);

      if (firstMagnitude === 0 || secondMagnitude === 0) {
        return null;
      }

      const dot = firstVector.x * secondVector.x + firstVector.y * secondVector.y;
      const cosine = Math.max(-1, Math.min(1, dot / (firstMagnitude * secondMagnitude)));
      return (Math.acos(cosine) * 180) / Math.PI;
    };

    const bends: ConnectedBend[] = [];

    for (const [pointId, connectedSegments] of segmentsByPoint.entries()) {
      if (connectedSegments.length !== 2) {
        continue;
      }

      const bendPoint = pointsById.get(pointId);
      const firstPoint = getOtherPointForSegmentAtPoint(connectedSegments[0], pointId);
      const secondPoint = getOtherPointForSegmentAtPoint(connectedSegments[1], pointId);

      if (!bendPoint || !firstPoint || !secondPoint) {
        continue;
      }

      const angle = angleBetweenVectors(
        { x: firstPoint.x - bendPoint.x, y: firstPoint.y - bendPoint.y },
        { x: secondPoint.x - bendPoint.x, y: secondPoint.y - bendPoint.y }
      );

      if (angle === null || angle <= 0.001 || angle >= 179.999) {
        continue;
      }

      bends.push({
        point: bendPoint,
        angle,
        segA: connectedSegments[0],
        segB: connectedSegments[1],
      });
    }

    return bends;
  })();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setAlternateAngleLabels({});
    setShowDimensions(false);
    setShowAngles(false);

    if (points.length === 0) {
      setZoom(0.8);
      setPan({ x: 0, y: 0 });
      return;
    }

    const xValues = points.map((point) => point.x);
    const yValues = points.map((point) => point.y);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    const shapeWidth = Math.max(maxX - minX, 1);
    const shapeHeight = Math.max(maxY - minY, 1);

    // Keep loaded profiles away from the top-left toolbar and give them more breathing room.
    const viewportPadding = {
      left: 140,
      right: 120,
      top: 90,
      bottom: 110,
    };
    const availableWidth = Math.max(canvas.width - viewportPadding.left - viewportPadding.right, 1);
    const availableHeight = Math.max(canvas.height - viewportPadding.top - viewportPadding.bottom, 1);
    const fittedZoom = Math.min(
      availableWidth / shapeWidth,
      availableHeight / shapeHeight,
      1.35
    );

    const normalizedZoom = Number.isFinite(fittedZoom)
      ? Math.max(0.2, fittedZoom * 0.9)
      : 0.8;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const targetCenterX = viewportPadding.left + availableWidth / 2;
    const targetCenterY = viewportPadding.top + availableHeight / 2;

    setZoom(normalizedZoom);
    setPan({
      x: targetCenterX - centerX * normalizedZoom,
      y: targetCenterY - centerY * normalizedZoom,
    });
  }, [viewResetKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    angleLabelHitboxesRef.current = [];

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context and apply transforms
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw background image if loaded
    if (backgroundImage) {
      ctx.globalAlpha = backgroundOpacity;
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1.0;
    }

    // Draw grid
    ctx.strokeStyle = '#808080';
    ctx.lineWidth = 1.5;
    
    // Calculate visible area in world coordinates (accounting for zoom and pan)
    const visibleLeft = -pan.x / zoom;
    const visibleTop = -pan.y / zoom;
    const visibleRight = (canvas.width - pan.x) / zoom;
    const visibleBottom = (canvas.height - pan.y) / zoom;
    
    // Extend grid beyond visible area for smooth panning
    const gridExtend = gridSize * 10;
    const startX = Math.floor((visibleLeft - gridExtend) / gridSize) * gridSize;
    const endX = Math.ceil((visibleRight + gridExtend) / gridSize) * gridSize;
    const startY = Math.floor((visibleTop - gridExtend) / gridSize) * gridSize;
    const endY = Math.ceil((visibleBottom + gridExtend) / gridSize) * gridSize;
    
    // Draw all grid lines in one path for better performance
    ctx.beginPath();
    // Draw vertical grid lines
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    
    // Draw horizontal grid lines
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // Draw segments
    // First pass - collect label positions to detect collisions
    const labelPositions: Array<{ x: number; y: number; width: number; height: number; segmentIndex: number }> = [];
    
    segments.forEach((segment, index) => {
      const startPoint = points.find(p => p.id === segment.startPointId);
      const endPoint = points.find(p => p.id === segment.endPointId);

      if (startPoint && endPoint) {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.strokeStyle = segment.id === selectedSegmentId ? '#e74c3c' : '#2c3e50';
        ctx.lineWidth = segment.id === selectedSegmentId ? 4 : 3;
        ctx.stroke();

        // Calculate label position and size for collision detection
        if (showDimensions) {
          const midX = (startPoint.x + endPoint.x) / 2;
          const midY = (startPoint.y + endPoint.y) / 2;
          
          const lengthInUnits = convertFromPixels(segment.length, unit);
          
          // Calculate bend allowance dimensions if material is available and there's a bend
          let bendInfo: { inner: number; neutral: number; outer: number } | null = null;
          if (material && index < segments.length - 1) {
            const nextSegment = segments[index + 1];
            const bendAngle = getAngleBetweenSegments(segment, nextSegment);
            
            if (bendAngle !== null && bendAngle > 0 && bendAngle < 180) {
              const lengthInches = unit === 'inch' ? lengthInUnits : lengthInUnits / 25.4;
              const actualBendAngle = Math.abs(180 - bendAngle);
              const bend = calculateBendAllowance(
                actualBendAngle,
                material.thicknessInches,
                material.kFactor
              );
              const unitMultiplier = unit === 'inch' ? 1 : 25.4;
              bendInfo = {
                inner: lengthInches * unitMultiplier,
                neutral: (lengthInches + bend.neutralAxisLength) * unitMultiplier,
                outer: (lengthInches + bend.outerLength - bend.innerLength) * unitMultiplier,
              };
            }
          }
          
          const backgroundHeight = bendInfo ? 70 : 45;
          const backgroundWidth = bendInfo ? 100 : 85;
          
          // Try multiple positions around the segment midpoint
          const testDistances = [80, 120, 160, 200, 240, 280];
          const testAngles = [
            -Math.PI / 2,  // Above
            Math.PI / 2,   // Below
            0,             // Right
            Math.PI,       // Left
            -Math.PI / 4,  // Top-right
            Math.PI / 4,   // Bottom-right
            3 * Math.PI / 4,   // Bottom-left
            -3 * Math.PI / 4,  // Top-left
          ];
          
          let bestX = midX;
          let bestY = midY;
          let bestScore = -1;
          let found = false;
          
          for (const distance of testDistances) {
            if (found) break;
            
            for (const angle of testAngles) {
              const testOffsetX = Math.cos(angle) * distance;
              const testOffsetY = Math.sin(angle) * distance;
              const testX = midX + testOffsetX - backgroundWidth / 2;
              const testY = midY + testOffsetY - 30;
              
              // Check collision with existing labels
              let hasCollision = false;
              let minDistance = Infinity;
              
              for (const existing of labelPositions) {
                const margin = 30;
                
                // Check if rectangles overlap
                if (!(testX + backgroundWidth + margin < existing.x ||
                      testX > existing.x + existing.width + margin ||
                      testY + backgroundHeight + margin < existing.y ||
                      testY > existing.y + existing.height + margin)) {
                  hasCollision = true;
                  break;
                }
                
                // Calculate distance to existing label (for scoring)
                const centerX = testX + backgroundWidth / 2;
                const centerY = testY + backgroundHeight / 2;
                const existingCenterX = existing.x + existing.width / 2;
                const existingCenterY = existing.y + existing.height / 2;
                const dist = Math.sqrt(
                  Math.pow(centerX - existingCenterX, 2) + 
                  Math.pow(centerY - existingCenterY, 2)
                );
                minDistance = Math.min(minDistance, dist);
              }
              
              if (!hasCollision) {
                // Score based on distance from segment and distance from other labels
                const score = minDistance - distance * 0.5;
                
                if (score > bestScore) {
                  bestScore = score;
                  bestX = midX + testOffsetX;
                  bestY = midY + testOffsetY;
                  
                  // If distance is minimal, accept it immediately
                  if (distance <= 80) {
                    found = true;
                    break;
                  }
                }
              }
            }
          }
          
          // Store label position
          labelPositions.push({
            x: bestX - backgroundWidth/2,
            y: bestY - 30,
            width: backgroundWidth,
            height: backgroundHeight,
            segmentIndex: index
          });
          
          const label = segment.label || String.fromCharCode(65 + index);
          
          // Draw leader line if label was moved significantly
          const offsetX = bestX - midX;
          const offsetY = bestY - midY;
          const distMoved = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
          if (distMoved > 15) {
            ctx.beginPath();
            ctx.moveTo(midX, midY);
            ctx.lineTo(bestX, bestY);
            ctx.strokeStyle = 'rgba(100, 100, 100, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([5, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
          }
          
          // Draw label background
          ctx.fillStyle = 'rgba(150, 150, 150, 0.92)';
          ctx.fillRect(bestX - backgroundWidth/2, bestY - 30, backgroundWidth, backgroundHeight);
          
          // Add subtle border for better visibility
          ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
          ctx.lineWidth = 1;
          ctx.strokeRect(bestX - backgroundWidth/2, bestY - 30, backgroundWidth, backgroundHeight);
          
          // Draw label text
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 22px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(label, bestX, bestY - 8);
          
          // Draw dimensions
          if (bendInfo) {
            ctx.font = '14px Arial';
            ctx.fillStyle = '#ffcccc';
            ctx.fillText(`↓ ${bendInfo.inner.toFixed(2)}`, bestX, bestY + 6);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`⊙ ${bendInfo.neutral.toFixed(2)}`, bestX, bestY + 20);
            ctx.fillStyle = '#ccddff';
            ctx.fillText(`↑ ${bendInfo.outer.toFixed(2)}`, bestX, bestY + 34);
            ctx.fillStyle = '#dddddd';
            ctx.font = '13px Arial';
            ctx.fillText(unitLabel, bestX, bestY + 48);
          } else {
            ctx.font = '18px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`${lengthInUnits.toFixed(1)} ${unitLabel}`, bestX, bestY + 10);
          }
        }
      }
    });

    // Draw angles between connected segments
    if (showAngles) {
      connectedBends.forEach((bendInfo) => {
        const commonPoint = bendInfo.point;
        const firstPoint = getOtherPointForSegmentAtPoint(bendInfo.segA, commonPoint.id);
        const secondPoint = getOtherPointForSegmentAtPoint(bendInfo.segB, commonPoint.id);

        if (!firstPoint || !secondPoint) {
          return;
        }

        const angleKey = getAngleLabelKey(bendInfo.segA, bendInfo.segB, commonPoint.id);
        const displayedAngle = getDisplayedAngle(bendInfo.angle, angleKey);

        const firstSegmentAngle = Math.atan2(firstPoint.y - commonPoint.y, firstPoint.x - commonPoint.x);
        const secondSegmentAngle = Math.atan2(secondPoint.y - commonPoint.y, secondPoint.x - commonPoint.x);
        let sweep = secondSegmentAngle - firstSegmentAngle;
        while (sweep <= -Math.PI) sweep += 2 * Math.PI;
        while (sweep > Math.PI) sweep -= 2 * Math.PI;

        const arcRadius = 25;
        ctx.beginPath();
        ctx.arc(commonPoint.x, commonPoint.y, arcRadius, firstSegmentAngle, firstSegmentAngle + sweep, sweep < 0);
        ctx.strokeStyle = '#9b59b6';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        const angleText = `${displayedAngle.toFixed(1)}°`;
        ctx.font = 'bold 18px Arial';
        const textMetrics = ctx.measureText(angleText);
        const textWidth = textMetrics.width;
        const bgPadding = 8;
        const angleWidth = textWidth + bgPadding * 2;
        const angleHeight = 28;

        const midAngle = firstSegmentAngle + sweep / 2;
        const labelDistance = 78;
        let bestAngleX = commonPoint.x + Math.cos(midAngle) * labelDistance;
        let bestAngleY = commonPoint.y + Math.sin(midAngle) * labelDistance;

        const testDistances = [78, 110, 145];
        const testOffsets = [0, Math.PI / 10, -Math.PI / 10, Math.PI / 6, -Math.PI / 6];
        let bestAngleScore = -1;

        for (const distance of testDistances) {
          for (const testOffset of testOffsets) {
            const candidateAngle = midAngle + testOffset;
            const candidateX = commonPoint.x + Math.cos(candidateAngle) * distance;
            const candidateY = commonPoint.y + Math.sin(candidateAngle) * distance;
            const testX = candidateX - angleWidth / 2;
            const testY = candidateY - angleHeight / 2;

            let hasCollision = false;
            let minDistance = Infinity;

            for (const existing of labelPositions) {
              const margin = 18;
              if (!(testX + angleWidth + margin < existing.x ||
                    testX > existing.x + existing.width + margin ||
                    testY + angleHeight + margin < existing.y ||
                    testY > existing.y + existing.height + margin)) {
                hasCollision = true;
                break;
              }

              const centerX = testX + angleWidth / 2;
              const centerY = testY + angleHeight / 2;
              const existingCenterX = existing.x + existing.width / 2;
              const existingCenterY = existing.y + existing.height / 2;
              const distanceToExisting = Math.sqrt(
                Math.pow(centerX - existingCenterX, 2) +
                Math.pow(centerY - existingCenterY, 2)
              );
              minDistance = Math.min(minDistance, distanceToExisting);
            }

            if (!hasCollision) {
              const score = minDistance - Math.abs(testOffset) * 60 - distance * 0.2;
              if (score > bestAngleScore) {
                bestAngleScore = score;
                bestAngleX = candidateX;
                bestAngleY = candidateY;
              }
            }
          }
        }

        const angleOffsetX = bestAngleX - commonPoint.x;
        const angleOffsetY = bestAngleY - commonPoint.y;
        const angleDistMoved = Math.sqrt(angleOffsetX * angleOffsetX + angleOffsetY * angleOffsetY);
        if (angleDistMoved > 40) {
          ctx.beginPath();
          ctx.moveTo(commonPoint.x + Math.cos(midAngle) * arcRadius, commonPoint.y + Math.sin(midAngle) * arcRadius);
          ctx.lineTo(bestAngleX, bestAngleY);
          ctx.strokeStyle = 'rgba(155, 89, 182, 0.45)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([5, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.fillStyle = 'rgba(150, 150, 150, 0.92)';
        ctx.fillRect(
          bestAngleX - angleWidth / 2,
          bestAngleY - angleHeight / 2,
          angleWidth,
          angleHeight
        );

        ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(
          bestAngleX - angleWidth / 2,
          bestAngleY - angleHeight / 2,
          angleWidth,
          angleHeight
        );

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(angleText, bestAngleX, bestAngleY + 6);

        labelPositions.push({
          x: bestAngleX - angleWidth / 2,
          y: bestAngleY - angleHeight / 2,
          width: angleWidth,
          height: angleHeight,
          segmentIndex: -1,
        });

        angleLabelHitboxesRef.current.push({
          key: angleKey,
          x: bestAngleX - angleWidth / 2,
          y: bestAngleY - angleHeight / 2,
          width: angleWidth,
          height: angleHeight,
        });
      });
    }

    // Draw temporary segment line (when adding segment)
    if (mode === 'addSegment' && tempSegmentStart) {
      const startPoint = points.find(p => p.id === tempSegmentStart);
      if (startPoint) {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw points
    points.forEach(point => {
      const MERGE_THRESHOLD = 15;
      let isMergeTarget = false;
      
      // Check if this point is a merge target (another point is being dragged close to it)
      if (draggingPointId && draggingPointId !== point.id) {
        const draggedPoint = points.find(p => p.id === draggingPointId);
        if (draggedPoint) {
          const dx = point.x - draggedPoint.x;
          const dy = point.y - draggedPoint.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          isMergeTarget = distance < MERGE_THRESHOLD;
        }
      }
      
      ctx.beginPath();
      ctx.arc(point.x, point.y, POINT_RADIUS, 0, 2 * Math.PI);
      
      if (isMergeTarget) {
        // Highlight merge target with green
        ctx.fillStyle = '#2ecc71';
        // Draw pulsing ring around target
        ctx.save();
        ctx.beginPath();
        ctx.arc(point.x, point.y, POINT_RADIUS + 6, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(46, 204, 113, 0.5)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      } else if (point.id === selectedPointId) {
        ctx.fillStyle = '#e74c3c';
      } else if (point.id === tempSegmentStart) {
        ctx.fillStyle = '#f39c12';
      } else {
        ctx.fillStyle = '#3498db';
      }
      
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw constraint visualization when dragging
      if (point.id === draggingPointId && editMode !== 'free') {
        const connectedSegments = segments.filter(
          s => s.startPointId === point.id || s.endPointId === point.id
        );
        
        if (connectedSegments.length > 0) {
          const segment = connectedSegments[0];
          const isStart = segment.startPointId === point.id;
          const anchorPoint = points.find(p => 
            p.id === (isStart ? segment.endPointId : segment.startPointId)
          );

          if (anchorPoint) {
            if (editMode === 'lockLength') {
              // Draw circle showing locked length constraint
              ctx.beginPath();
              ctx.arc(anchorPoint.x, anchorPoint.y, segment.length, 0, 2 * Math.PI);
              ctx.strokeStyle = 'rgba(52, 152, 219, 0.4)';
              ctx.lineWidth = 1;
              ctx.setLineDash([5, 5]);
              ctx.stroke();
              ctx.setLineDash([]);
            } else if (editMode === 'lockAngle') {
              // Draw line showing locked angle constraint
              const angle = segment.angle! * (Math.PI / 180);
              const extendLength = 2000;
              ctx.beginPath();
              ctx.moveTo(
                anchorPoint.x - extendLength * Math.cos(angle),
                anchorPoint.y - extendLength * Math.sin(angle)
              );
              ctx.lineTo(
                anchorPoint.x + extendLength * Math.cos(angle),
                anchorPoint.y + extendLength * Math.sin(angle)
              );
              ctx.strokeStyle = 'rgba(243, 156, 18, 0.4)';
              ctx.lineWidth = 1;
              ctx.setLineDash([5, 5]);
              ctx.stroke();
              ctx.setLineDash([]);
            }
          }
        }
      }

      // Draw point label
      if (point.label) {
        ctx.font = 'bold 18px Arial';
        const textMetrics = ctx.measureText(point.label);
        const textWidth = textMetrics.width;
        const bgPadding = 6;
        
        // Draw background
        ctx.fillStyle = 'rgba(150, 150, 150, 0.85)';
        ctx.fillRect(
          point.x - textWidth/2 - bgPadding,
          point.y - 14,
          textWidth + bgPadding * 2,
          26
        );
        
        // Draw label
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(point.label, point.x, point.y + 4);
      }
    });

    // Restore context
    ctx.restore();
  }, [points, segments, selectedPointId, selectedSegmentId, unit, material, mode, tempSegmentStart, mousePos, zoom, pan, draggingPointId, editMode, backgroundImage, backgroundOpacity, showDimensions, showAngles, alternateAngleLabels]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Transform coordinates to account for zoom and pan
    return {
      x: (x - pan.x) / zoom,
      y: (y - pan.y) / zoom,
    };
  };

  const findPointAtPosition = (x: number, y: number): string | null => {
    for (const point of points) {
      const dx = x - point.x;
      const dy = y - point.y;
      if (Math.sqrt(dx * dx + dy * dy) <= POINT_RADIUS + 5) {
        return point.id;
      }
    }
    return null;
  };

  const findSegmentAtPosition = (x: number, y: number): string | null => {
    for (const segment of segments) {
      const startPoint = points.find(p => p.id === segment.startPointId);
      const endPoint = points.find(p => p.id === segment.endPointId);

      if (startPoint && endPoint) {
        const distance = distanceToSegment(
          x, y,
          startPoint.x, startPoint.y,
          endPoint.x, endPoint.y
        );
        
        if (distance <= 8) {
          return segment.id;
        }
      }
    }
    return null;
  };

  const findAngleLabelAtPosition = (x: number, y: number): string | null => {
    for (const hitbox of angleLabelHitboxesRef.current) {
      const withinX = x >= hitbox.x && x <= hitbox.x + hitbox.width;
      const withinY = y >= hitbox.y && y <= hitbox.y + hitbox.height;

      if (withinX && withinY) {
        return hitbox.key;
      }
    }

    return null;
  };

  const distanceToSegment = (
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
  ): number => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Pan with middle mouse button
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const { x, y } = getCanvasCoordinates(e);
    const angleLabelKey = findAngleLabelAtPosition(x, y);

    if (angleLabelKey) {
      return;
    }

    const pointId = findPointAtPosition(x, y);

    if (mode === 'addSegment') {
      if (pointId) {
        if (!tempSegmentStart) {
          setTempSegmentStart(pointId);
          onSelectPoint(pointId);
        } else if (pointId !== tempSegmentStart) {
          onAddSegment(tempSegmentStart, pointId);
          setTempSegmentStart(null);
          onSelectPoint(null);
        }
      }
      return;
    }

    if (mode === 'select') {
      if (pointId) {
        setDraggingPointId(pointId);
        const point = points.find(p => p.id === pointId);
        if (point) {
          setOffset({ x: x - point.x, y: y - point.y });
        }
        onSelectPoint(pointId);
        onSelectSegment(null);
        return;
      }

      const segmentId = findSegmentAtPosition(x, y);
      if (segmentId) {
        onSelectSegment(segmentId);
        onSelectPoint(null);
        return;
      }

      onSelectPoint(null);
      onSelectSegment(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoordinates(e);
    setMousePos({ x, y });

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (draggingPointId && mode === 'select') {
      let newX = x - offset.x;
      let newY = y - offset.y;

      // Apply constraints based on editMode
      if (editMode !== 'free') {
        const connectedSegments = segments.filter(
          s => s.startPointId === draggingPointId || s.endPointId === draggingPointId
        );

        if (connectedSegments.length > 0) {
          const segment = connectedSegments[0];
          const isStart = segment.startPointId === draggingPointId;
          const anchorPoint = points.find(p => 
            p.id === (isStart ? segment.endPointId : segment.startPointId)
          );

          if (anchorPoint) {
            if (editMode === 'lockLength') {
              // Lock length - maintain distance, allow angle change
              const dx = newX - anchorPoint.x;
              const dy = newY - anchorPoint.y;
              const currentDistance = Math.sqrt(dx * dx + dy * dy);
              
              if (currentDistance > 0) {
                const scale = segment.length / currentDistance;
                newX = anchorPoint.x + dx * scale;
                newY = anchorPoint.y + dy * scale;
              }
            } else if (editMode === 'lockAngle') {
              // Lock angle - maintain direction, allow length change
              const originalAngle = segment.angle! * (Math.PI / 180);
              const dx = newX - anchorPoint.x;
              const dy = newY - anchorPoint.y;
              const newDistance = Math.sqrt(dx * dx + dy * dy);
              
              newX = anchorPoint.x + newDistance * Math.cos(originalAngle);
              newY = anchorPoint.y + newDistance * Math.sin(originalAngle);
            }
          }
        }
      }

      onUpdatePointPosition(draggingPointId, newX, newY);
    }
  };

  const handleMouseUp = () => {
    // Check if we were dragging a point and if it's close to another point
    if (draggingPointId && onMergePoints) {
      const draggedPoint = points.find(p => p.id === draggingPointId);
      if (draggedPoint) {
        const MERGE_THRESHOLD = 15; // pixels - distance at which points can merge
        
        // Find if there's another point nearby (excluding the dragged point)
        for (const point of points) {
          if (point.id === draggingPointId) continue;
          
          const dx = point.x - draggedPoint.x;
          const dy = point.y - draggedPoint.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < MERGE_THRESHOLD) {
            // Merge the dragged point into the nearby point
            onMergePoints(draggingPointId, point.id);
            break; // Only merge with one point
          }
        }
      }
    }
    
    setDraggingPointId(null);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoom * delta, 0.1), 5);
    
    setZoom(newZoom);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoordinates(e);
    const angleLabelKey = findAngleLabelAtPosition(x, y);

    if (angleLabelKey) {
      setAlternateAngleLabels((current) => ({
        ...current,
        [angleLabelKey]: !current[angleLabelKey],
      }));
      return;
    }

    if (mode === 'addPoint' && !draggingPointId) {
      onAddPoint(x, y);
    }
  };

  // Handle arrow keys for panning
  const handleKeyDown = (e: KeyboardEvent) => {
    const panStep = 20; // pixels to move per key press
    
    switch(e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setPan(prev => ({ ...prev, y: prev.y + panStep }));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setPan(prev => ({ ...prev, y: prev.y - panStep }));
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setPan(prev => ({ ...prev, x: prev.x + panStep }));
        break;
      case 'ArrowRight':
        e.preventDefault();
        setPan(prev => ({ ...prev, x: prev.x - panStep }));
        break;
      case 'Escape':
        if (tempSegmentStart) {
          setTempSegmentStart(null);
          onSelectPoint(null);
        }
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tempSegmentStart]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setBackgroundImage(img);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const clearBackgroundImage = () => {
    setBackgroundImage(null);
  };

  return (
    <div className="dimension-canvas-container">
      <div className="canvas-wrapper-inner">
        <div className="canvas-toolbar">
          <button 
            className={`toggle-dimensions-btn ${showDimensions ? 'active' : ''}`}
            onClick={() => setShowDimensions(!showDimensions)}
            title={showDimensions ? "Hide lengths" : "Show lengths"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="4" y1="12" x2="20" y2="12" strokeWidth="2"/>
              <line x1="4" y1="8" x2="4" y2="16" strokeWidth="2"/>
              <line x1="20" y1="8" x2="20" y2="16" strokeWidth="2"/>
            </svg>
            Lengths
          </button>
          <button 
            className={`toggle-dimensions-btn ${showAngles ? 'active' : ''}`}
            onClick={() => setShowAngles(!showAngles)}
            title={showAngles ? "Hide angles" : "Show angles"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20 9v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9" strokeWidth="2"/>
              <path d="M9 22V12h6v10M2 10.6L12 2l10 8.6" strokeWidth="2"/>
            </svg>
            Angles
          </button>
          <label className="upload-background-btn">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
              <polyline points="21 15 16 10 5 21" strokeWidth="2"/>
            </svg>
            {backgroundImage ? 'Change Background' : 'Add Background Image'}
          </label>
        </div>
        {backgroundImage && (
          <div className="background-image-controls">
            <button 
              className="bg-control-toggle"
              onClick={() => setShowBackgroundControls(!showBackgroundControls)}
              title="Background image controls"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                <polyline points="21 15 16 10 5 21" strokeWidth="2"/>
              </svg>
            </button>
            {showBackgroundControls && (
              <div className="bg-controls-panel">
                <label className="bg-control-item">
                  <span>Opacity:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={backgroundOpacity}
                    onChange={(e) => setBackgroundOpacity(parseFloat(e.target.value))}
                  />
                  <span>{Math.round(backgroundOpacity * 100)}%</span>
                </label>
                <button className="bg-remove-btn" onClick={clearBackgroundImage}>
                  Remove Background
                </button>
              </div>
            )}
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={900}
          height={600}
          className="dimension-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
          onWheel={handleWheel}
          onContextMenu={(e) => e.preventDefault()}
          style={{ 
            cursor: isPanning ? 'grabbing' : mode === 'addPoint' ? 'crosshair' : mode === 'addSegment' ? 'pointer' : 'default' 
          }}
        />
      </div>
      <div className="canvas-controls">
        <button className="zoom-button" onClick={handleZoomIn} title="Zoom In">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
            <line x1="11" y1="8" x2="11" y2="14" strokeWidth="2" strokeLinecap="round"/>
            <line x1="8" y1="11" x2="14" y2="11" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <button className="zoom-button" onClick={handleZoomOut} title="Zoom Out">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round"/>
            <line x1="8" y1="11" x2="14" y2="11" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <button className="zoom-button" onClick={handleResetView} title="Reset View">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 3v5h-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="zoom-level">{Math.round(zoom * 100)}%</div>
      </div>
      <div className="navigation-hint">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 19V5M5 12l7-7 7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Use arrow keys or mouse wheel to navigate</span>
      </div>
      {tempSegmentStart && (
        <div className="segment-hint">
          Click on another point to finish segment (ESC to cancel)
        </div>
      )}
    </div>
  );
};

export default DimensionCanvas;
