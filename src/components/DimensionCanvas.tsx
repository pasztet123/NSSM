import { useRef, useEffect, useState } from 'react';
import { Point, Segment, Unit, convertFromPixels, getUnitLabel, getGridSize } from '../types';
import './DimensionCanvas.css';

interface DimensionCanvasProps {
  points: Point[];
  segments: Segment[];
  selectedPointId: string | null;
  selectedSegmentId: string | null;
  mode: 'select' | 'addPoint' | 'addSegment';
  unit: Unit;
  onAddPoint: (x: number, y: number) => void;
  onAddSegment: (startPointId: string, endPointId: string) => void;
  onSelectPoint: (id: string | null) => void;
  onSelectSegment: (id: string | null) => void;
  onUpdatePointPosition: (id: string, x: number, y: number) => void;
  onUpdateSegmentAngle: (id: string, angle: number) => void;
  onRotateShape: (angle: number) => void;
}

const DimensionCanvas = ({
  points,
  segments,
  selectedPointId,
  selectedSegmentId,
  mode,
  unit,
  onAddPoint,
  onAddSegment,
  onSelectPoint,
  onSelectSegment,
  onUpdatePointPosition,
  onUpdateSegmentAngle,
  onRotateShape,
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

    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    
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
        
        // Draw label background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(midX - 30, midY - 25, 60, 35);
        
        // Draw label text
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, midX, midY - 10);
        
        // Draw length
        ctx.font = '12px Arial';
        ctx.fillText(`${lengthInUnits.toFixed(1)} ${unitLabel}`, midX, midY + 5);

        // Draw angle if available
        if (segment.angle !== undefined) {
          ctx.font = '10px Arial';
          ctx.fillStyle = '#3498db';
          ctx.fillText(`${segment.angle.toFixed(1)}°`, midX, midY + 18);
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
            
            // Draw angle text
            ctx.fillStyle = '#9b59b6';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${angle.toFixed(1)}°`, commonPoint.x, commonPoint.y - 30);
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
      ctx.beginPath();
      ctx.arc(point.x, point.y, POINT_RADIUS, 0, 2 * Math.PI);
      
      if (point.id === selectedPointId) {
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

      // Draw point label
      ctx.fillStyle = '#2c3e50';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(point.id.split('-')[1] || '?', point.x, point.y + 3);
    });

    // Restore context
    ctx.restore();
  }, [points, segments, selectedPointId, selectedSegmentId, unit, mode, tempSegmentStart, mousePos, zoom, pan]);

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

  return (
    <div className="dimension-canvas-container">
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
