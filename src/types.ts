export interface Point {
  id: string;
  x: number;
  y: number;
  label?: string;
}

export type EditMode = 'free' | 'lockLength' | 'lockAngle';

export interface Segment {
  id: string;
  startPointId: string;
  endPointId: string;
  length: number;
  label?: string; // Optional label for the segment (e.g., 'A', 'B', 'C')
  angle?: number; // Angle in degrees relative to the horizontal axis
}

export type Unit = 'mm' | 'inch';

export const PIXELS_PER_MM = 3.7795; // 96 DPI / 25.4
export const MM_PER_INCH = 25.4;

export function convertToPixels(value: number, unit: Unit): number {
  if (unit === 'mm') {
    return value * PIXELS_PER_MM;
  }
  return value * MM_PER_INCH * PIXELS_PER_MM;
}

export function convertFromPixels(pixels: number, unit: Unit): number {
  if (unit === 'mm') {
    return pixels / PIXELS_PER_MM;
  }
  return pixels / (MM_PER_INCH * PIXELS_PER_MM);
}

export function getUnitLabel(unit: Unit): string {
  return unit === 'mm' ? 'mm' : 'in';
}

export function getGridSize(unit: Unit): number {
  // Grid every 10mm or 0.5 inch
  return unit === 'mm' ? 10 * PIXELS_PER_MM : 0.5 * MM_PER_INCH * PIXELS_PER_MM;
}

export interface Model3D {
  id: string;
  name: string;
  description: string;
  geometryType: 'box' | 'cylinder' | 'lProfile' | 'tProfile' | 'custom' | 'uploaded';
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    radius?: number;
  };
  sketch2D: {
    points: Point[];
    segments: Segment[];
  };
  color?: string;
  uploadedFile?: string; // Base64 or URL for uploaded models
  fileType?: 'stl' | 'obj' | 'gltf' | 'glb';
}

export interface Material {
  id: string;
  name: string;
  type: 'copper' | 'steel' | 'aluminum';
  thickness: string; // e.g., "16 oz", "24 Ga", "0.032\""
  finish?: string; // e.g., "Kynar"
  sheetPrice: number; // Price per full sheet
  sheetWidth: number; // Sheet width in inches (36" for copper, 48" for aluminum/steel)
  sheetLength: number; // Sheet length in inches (120" = 10 feet)
  allowedWidths: number[]; // Allowed strip widths in inches
  weight?: number; // Weight per square foot (optional)
  color?: string;
}

export type ProductType = 'coping-cap' | 'z-closure' | 'd-style' | 't-style' | 'valley' | 'roof-to-wall' | 'gravel-stop' | 'j-channel' | 'other';

export interface LaborCost {
  productType: ProductType;
  costPerUnit: number; // Cost per flashing
}

export interface Product {
  id: string;
  name: string;
  category: string;
  productType: ProductType; // Type for labor cost calculation
  description: string;
  longDescription?: string;
  basePrice: number; // Price per linear foot or meter
  currency: 'USD' | 'EUR' | 'PLN';
  images: string[]; // Array of image URLs
  specifications: {
    material?: string;
    thickness?: string;
    finish?: string;
    color?: string;
    [key: string]: string | undefined;
  };
  model3D?: Model3D; // Optional 3D model
  model3DId?: string; // Optional 3D model ID from database
  model3DRotation?: [number, number, number]; // Rotation for this product's 3D model in radians [x, y, z]
  sketch2D?: {
    points: Point[];
    segments: Segment[];
  }; // Optional 2D sketch
  defaultDimensions?: {
    points: Point[];
    segments: Segment[];
  };
  selectedMaterial?: string; // Material ID
  createdAt: string;
  updatedAt: string;
}
