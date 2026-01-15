import { Model3D, convertToPixels } from '../types';

// Sample 3D models with associated 2D sketches
export const sampleModels: Model3D[] = [
  {
    id: 'model-1',
    name: 'Rectangular Sheet',
    description: 'Simple rectangular sheet metal profile - 100mm x 50mm',
    geometryType: 'box',
    dimensions: {
      width: 100,
      height: 50,
      depth: 2,
    },
    color: '#3498db',
    sketch2D: {
      points: [
        { id: 'p1', x: convertToPixels(0, 'mm'), y: convertToPixels(0, 'mm') },
        { id: 'p2', x: convertToPixels(100, 'mm'), y: convertToPixels(0, 'mm') },
        { id: 'p3', x: convertToPixels(100, 'mm'), y: convertToPixels(50, 'mm') },
        { id: 'p4', x: convertToPixels(0, 'mm'), y: convertToPixels(50, 'mm') },
      ],
      segments: [
        { id: 's1', startPointId: 'p1', endPointId: 'p2', length: convertToPixels(100, 'mm') },
        { id: 's2', startPointId: 'p2', endPointId: 'p3', length: convertToPixels(50, 'mm') },
        { id: 's3', startPointId: 'p3', endPointId: 'p4', length: convertToPixels(100, 'mm') },
        { id: 's4', startPointId: 'p4', endPointId: 'p1', length: convertToPixels(50, 'mm') },
      ],
    },
  },
  {
    id: 'model-2',
    name: 'L-Profile',
    description: 'L-shaped profile - 80mm x 60mm',
    geometryType: 'lProfile',
    dimensions: {
      width: 80,
      height: 60,
      depth: 5,
    },
    color: '#e74c3c',
    sketch2D: {
      points: [
        { id: 'p1', x: convertToPixels(0, 'mm'), y: convertToPixels(0, 'mm') },
        { id: 'p2', x: convertToPixels(80, 'mm'), y: convertToPixels(0, 'mm') },
        { id: 'p3', x: convertToPixels(80, 'mm'), y: convertToPixels(10, 'mm') },
        { id: 'p4', x: convertToPixels(10, 'mm'), y: convertToPixels(10, 'mm') },
        { id: 'p5', x: convertToPixels(10, 'mm'), y: convertToPixels(60, 'mm') },
        { id: 'p6', x: convertToPixels(0, 'mm'), y: convertToPixels(60, 'mm') },
      ],
      segments: [
        { id: 's1', startPointId: 'p1', endPointId: 'p2', length: convertToPixels(80, 'mm') },
        { id: 's2', startPointId: 'p2', endPointId: 'p3', length: convertToPixels(10, 'mm') },
        { id: 's3', startPointId: 'p3', endPointId: 'p4', length: convertToPixels(70, 'mm') },
        { id: 's4', startPointId: 'p4', endPointId: 'p5', length: convertToPixels(50, 'mm') },
        { id: 's5', startPointId: 'p5', endPointId: 'p6', length: convertToPixels(10, 'mm') },
        { id: 's6', startPointId: 'p6', endPointId: 'p1', length: convertToPixels(60, 'mm') },
      ],
    },
  },
  {
    id: 'model-3',
    name: 'T-Profile',
    description: 'T-shaped profile - 60mm x 60mm',
    geometryType: 'tProfile',
    dimensions: {
      width: 60,
      height: 60,
      depth: 5,
    },
    color: '#27ae60',
    sketch2D: {
      points: [
        { id: 'p1', x: convertToPixels(0, 'mm'), y: convertToPixels(0, 'mm') },
        { id: 'p2', x: convertToPixels(60, 'mm'), y: convertToPixels(0, 'mm') },
        { id: 'p3', x: convertToPixels(60, 'mm'), y: convertToPixels(10, 'mm') },
        { id: 'p4', x: convertToPixels(35, 'mm'), y: convertToPixels(10, 'mm') },
        { id: 'p5', x: convertToPixels(35, 'mm'), y: convertToPixels(60, 'mm') },
        { id: 'p6', x: convertToPixels(25, 'mm'), y: convertToPixels(60, 'mm') },
        { id: 'p7', x: convertToPixels(25, 'mm'), y: convertToPixels(10, 'mm') },
        { id: 'p8', x: convertToPixels(0, 'mm'), y: convertToPixels(10, 'mm') },
      ],
      segments: [
        { id: 's1', startPointId: 'p1', endPointId: 'p2', length: convertToPixels(60, 'mm') },
        { id: 's2', startPointId: 'p2', endPointId: 'p3', length: convertToPixels(10, 'mm') },
        { id: 's3', startPointId: 'p3', endPointId: 'p4', length: convertToPixels(25, 'mm') },
        { id: 's4', startPointId: 'p4', endPointId: 'p5', length: convertToPixels(50, 'mm') },
        { id: 's5', startPointId: 'p5', endPointId: 'p6', length: convertToPixels(10, 'mm') },
        { id: 's6', startPointId: 'p6', endPointId: 'p7', length: convertToPixels(50, 'mm') },
        { id: 's7', startPointId: 'p7', endPointId: 'p8', length: convertToPixels(25, 'mm') },
        { id: 's8', startPointId: 'p8', endPointId: 'p1', length: convertToPixels(10, 'mm') },
      ],
    },
  },
  {
    id: 'model-4',
    name: 'Square Tube',
    description: 'Square tube profile - 40mm x 40mm',
    geometryType: 'box',
    dimensions: {
      width: 40,
      height: 40,
      depth: 40,
    },
    color: '#9b59b6',
    sketch2D: {
      points: [
        { id: 'p1', x: convertToPixels(0, 'mm'), y: convertToPixels(0, 'mm') },
        { id: 'p2', x: convertToPixels(40, 'mm'), y: convertToPixels(0, 'mm') },
        { id: 'p3', x: convertToPixels(40, 'mm'), y: convertToPixels(40, 'mm') },
        { id: 'p4', x: convertToPixels(0, 'mm'), y: convertToPixels(40, 'mm') },
      ],
      segments: [
        { id: 's1', startPointId: 'p1', endPointId: 'p2', length: convertToPixels(40, 'mm') },
        { id: 's2', startPointId: 'p2', endPointId: 'p3', length: convertToPixels(40, 'mm') },
        { id: 's3', startPointId: 'p3', endPointId: 'p4', length: convertToPixels(40, 'mm') },
        { id: 's4', startPointId: 'p4', endPointId: 'p1', length: convertToPixels(40, 'mm') },
      ],
    },
  },
];
