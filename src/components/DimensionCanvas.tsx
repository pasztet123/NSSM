import { useRef, useEffect, useState } from 'react';
import { Point, Segment, Unit, EditMode, Material, convertFromPixels, getUnitLabel, getGridSize, calculateBendAllowance } from '../types';
import './DimensionCanvas.css';

interface DimensionCanvasProps {
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

const DimensionCanvas = ({
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
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [tempSegmentStart, setTempSegmentStart] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.5);
  const [showBackgroundControls, setShowBackgroundControls] = useState(false);
  
  // Future use for rotation and angle editing
  void onUpdateSegmentAngle;
  void onRotateShape;

  const POINT_RADIUS = 8;
  const gridSize = getGridSize(unit);
  const unitLabel = getUnitLabel(unit);

  // Calculate angle between two points (in degrees)
  const calculateAngle = (x1: number, y1: number, x2: number, y2: number): number => {
    const radians = Math.atan2(y2 - y1, x2 - x1);
    const degrees = radians * (180 / Math.PI);
    return degrees;
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
    
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw segments
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

        // Draw segment label (A, B, C, ...)
        const midX = (startPoint.x + endPoint.x) / 2;
        const midY = (startPoint.y + endPoint.y) / 2;
        
        const label = segment.label || String.fromCharCode(65 + index); // A, B, C, ...
        const lengthInUnits = convertFromPixels(segment.length, unit);
        
        // Calculate bend allowance dimensions if material is available and there's a bend
        let bendInfo: { inner: number; neutral: number; outer: number } | null = null;
        if (material && index < segments.length - 1) {
          const nextSegment = segments[index + 1];
          const bendAngle = getAngleBetweenSegments(segment, nextSegment);
          
          if (bendAngle !== null && bendAngle > 0 && bendAngle < 180) {
            // Convert from pixels to inches
            const lengthInches = unit === 'inch' 
              ? lengthInUnits 
              : lengthInUnits / 25.4;
            
            // Calculate bend allowance for the bend at the end of this segment
            const actualBendAngle = Math.abs(180 - bendAngle);
            const bend = calculateBendAllowance(
              actualBendAngle,
              material.thicknessInches,
              material.kFactor
            );
            
            // Convert back to current unit
            const unitMultiplier = unit === 'inch' ? 1 : 25.4;
            bendInfo = {
              inner: lengthInches * unitMultiplier,
              neutral: (lengthInches + bend.neutralAxisLength) * unitMultiplier,
              outer: (lengthInches + bend.outerLength - bend.innerLength) * unitMultiplier,
            };
          }
        }
        
        // Adjust background size if showing bend info
        const backgroundHeight = bendInfo ? 70 : 45;
        const backgroundWidth = bendInfo ? 100 : 85;
        
        // Draw label background - szare tło
        ctx.fillStyle = 'rgba(150, 150, 150, 0.85)';
        ctx.fillRect(midX - backgroundWidth/2, midY - 30, backgroundWidth, backgroundHeight);
        
        // Draw label text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, midX, midY - 8);
        
        // Draw dimensions
        if (bendInfo) {
          // Show three dimensions
          ctx.font = '14px Arial';
          ctx.fillStyle = '#ffcccc'; // Light red for compression (inner)
          ctx.fillText(`↓ ${bendInfo.inner.toFixed(2)}`, midX, midY + 6);
          
          ctx.fillStyle = '#ffffff'; // White for neutral axis
          ctx.fillText(`⊙ ${bendInfo.neutral.toFixed(2)}`, midX, midY + 20);
          
          ctx.fillStyle = '#ccddff'; // Light blue for tension (outer)
          ctx.fillText(`↑ ${bendInfo.outer.toFixed(2)}`, midX, midY + 34);
          
          ctx.fillStyle = '#dddddd';
          ctx.font = '13px Arial';
          ctx.fillText(unitLabel, midX, midY + 48);
        } else {
          // Show single dimension
          ctx.font = '18px Arial';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(`${lengthInUnits.toFixed(1)} ${unitLabel}`, midX, midY + 10);
        }
      }
    });

    // Draw angles between connected segments
    segments.forEach((segment, idx) => {
      if (idx < segments.length - 1) {
        const nextSegment = segments[idx + 1];
        const angle = getAngleBetweenSegments(segment, nextSegment);
        
        if (angle !== null) {
          // Find common point
          let commonPoint: Point | undefined;
          if (segment.endPointId === nextSegment.startPointId) {
            commonPoint = points.find(p => p.id === segment.endPointId);
          }
          
          if (commonPoint) {
            // Draw angle arc
            ctx.beginPath();
            ctx.arc(commonPoint.x, commonPoint.y, 25, 0, 2 * Math.PI);
            ctx.strokeStyle = '#9b59b6';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Draw angle text background
            const angleText = `${angle.toFixed(1)}°`;
            ctx.font = 'bold 18px Arial';
            const textMetrics = ctx.measureText(angleText);
            const textWidth = textMetrics.width;
            const bgPadding = 8;
            
            ctx.fillStyle = 'rgba(150, 150, 150, 0.85)';
            ctx.fillRect(
              commonPoint.x - textWidth/2 - bgPadding,
              commonPoint.y - 45,
              textWidth + bgPadding * 2,
              28
            );
            
            // Draw angle text
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(angleText, commonPoint.x, commonPoint.y - 25);
          }
        }
      }
    });

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
  }, [points, segments, selectedPointId, selectedSegmentId, unit, material, mode, tempSegmentStart, mousePos, zoom, pan, draggingPointId, editMode]);

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
      onUpdatePointPosition(draggingPointId, x - offset.x, y - offset.y);
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
    if (mode === 'addPoint' && !draggingPointId) {
      const { x, y } = getCanvasCoordinates(e);
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
          width={1200}
          height={800}
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
