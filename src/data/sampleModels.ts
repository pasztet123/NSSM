import { Model3D } from '../types';
import { convertToPixels } from '../types';

// Sample 3D models with associated 2D sketches
export const sampleModels: Model3D[] = [
  {
    id: 'model-valley',
    name: 'Valley',
    description: 'Valley flashing profile - 120mm x 40mm',
    geometryType: 'custom',
    sketch2D: {
      points: [
        { id: 'p1', x: convertToPixels(0, 'mm'), y: convertToPixels(0, 'mm') },
        { id: 'p2', x: convertToPixels(120, 'mm'), y: convertToPixels(0, 'mm') },
        { id: 'p3', x: convertToPixels(120, 'mm'), y: convertToPixels(10, 'mm') },
        { id: 'p4', x: convertToPixels(70, 'mm'), y: convertToPixels(40, 'mm') },
        { id: 'p5', x: convertToPixels(50, 'mm'), y: convertToPixels(40, 'mm') },
        { id: 'p6', x: convertToPixels(0, 'mm'), y: convertToPixels(10, 'mm') },
      ],
      segments: [
        { id: 's1', startPointId: 'p1', endPointId: 'p2', length: convertToPixels(120, 'mm'), label: 'A' },
        { id: 's2', startPointId: 'p2', endPointId: 'p3', length: convertToPixels(10, 'mm'), label: 'B' },
        { id: 's3', startPointId: 'p3', endPointId: 'p4', length: convertToPixels(58.3, 'mm'), label: 'C' },
        { id: 's4', startPointId: 'p4', endPointId: 'p5', length: convertToPixels(20, 'mm'), label: 'D' },
        { id: 's5', startPointId: 'p5', endPointId: 'p6', length: convertToPixels(58.3, 'mm'), label: 'E' },
        { id: 's6', startPointId: 'p6', endPointId: 'p1', length: convertToPixels(10, 'mm'), label: 'F' },
      ],
    },
    color: '#3498db',
  },
];
