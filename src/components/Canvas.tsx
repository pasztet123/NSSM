import { useRef, useEffect, useState } from 'react';
import { Point, Segment, Unit, convertFromPixels, getUnitLabel, getGridSize } from '../types';
import './Canvas.css';

interface CanvasProps {
  points: Point[];
  segments: Segment[];
  selectedPointId: string | null;
  selectedSegmentId: string | null;
  mode: 'select' | 'addPoint';
  unit: Unit;
  onAddPoint: (x: number, y: number) => void;
  onSelectPoint: (id: string | null) => void;
  onSelectSegment: (id: string | null) => void;
  onUpdatePointPosition: (id: string, x: number, y: number) => void;
}

const Canvas = ({
  points,
  segments,
  selectedPointId,
  selectedSegmentId,
  mode,
  unit,
  onAddPoint,
  onSelectPoint,
  onSelectSegment,
  onUpdatePointPosition,
}: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const POINT_RADIUS = 6;
  const gridSize = getGridSize(unit);
  const unitLabel = getUnitLabel(unit);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
    segments.forEach(segment => {
      const startPoint = points.find(p => p.id === segment.startPointId);
      const endPoint = points.find(p => p.id === segment.endPointId);

      if (startPoint && endPoint) {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.strokeStyle = segment.id === selectedSegmentId ? '#e74c3c' : '#3498db';
        ctx.lineWidth = segment.id === selectedSegmentId ? 3 : 2;
        ctx.stroke();

        // Draw length label
        const midX = (startPoint.x + endPoint.x) / 2;
        const midY = (startPoint.y + endPoint.y) / 2;
        
        const lengthInUnits = convertFromPixels(segment.length, unit);
        
        ctx.fillStyle = '#2c3e50';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${lengthInUnits.toFixed(2)} ${unitLabel}`, midX, midY - 5);
      }
    });

    // Draw points
    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, POINT_RADIUS, 0, 2 * Math.PI);
      ctx.fillStyle = point.id === selectedPointId ? '#e74c3c' : '#2c3e50';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw point coordinates
      const xInUnits = convertFromPixels(point.x, unit);
      const yInUnits = convertFromPixels(point.y, unit);
      
      ctx.fillStyle = '#2c3e50';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`(${xInUnits.toFixed(1)}, ${yInUnits.toFixed(1)})`, point.x, point.y - 12);
    });
  }, [points, segments, selectedPointId, selectedSegmentId, unit]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
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
        
        if (distance <= 5) {
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
    const { x, y } = getCanvasCoordinates(e);

    if (mode === 'select') {
      const pointId = findPointAtPosition(x, y);
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
    if (draggingPointId && mode === 'select') {
      const { x, y } = getCanvasCoordinates(e);
      onUpdatePointPosition(draggingPointId, x - offset.x, y - offset.y);
    }
  };

  const handleMouseUp = () => {
    setDraggingPointId(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode === 'addPoint' && !draggingPointId) {
      const { x, y } = getCanvasCoordinates(e);
      onAddPoint(x, y);
    }
  };

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        width={1200}
        height={800}
        className="canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        style={{ cursor: mode === 'addPoint' ? 'crosshair' : 'default' }}
      />
    </div>
  );
};

export default Canvas;
