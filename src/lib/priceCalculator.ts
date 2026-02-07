import { Segment, Material, Point, convertFromPixels, ProductType, calculateBendAllowance } from '../types';
import { PricingConfig } from '../data/pricingConfig';

interface PriceCalculation {
  materialCost: number;
  laborCost: number;
  setupFee: number;
  subtotal: number;
  profitMargin: number;
  profitAmount: number;
  totalCost: number;
  totalCostPerUnit: number;
  quantity: number;
  requiredWidth: number; // in inches
  chargedWidth: number; // in inches (accounting for waste)
  stripLength: number; // in feet (always 10')
  sheetFraction: number; // fraction of sheet used

  // Hard constraint: cannot exceed max sheet/coil width
  maxAllowedWidth: number; // in inches (typically 24/36/48 depending on material)
  isWidthExceeded: boolean;
}

/**
 * Find the smallest allowed width that fits the required width
 * This accounts for waste material
 */
function findChargedWidth(requiredWidth: number, allowedWidths: number[]): number {
  const sortedWidths = [...allowedWidths].sort((a, b) => a - b);
  
  for (const width of sortedWidths) {
    if (width >= requiredWidth) {
      return width;
    }
  }
  
  // If required width exceeds all allowed widths, return the largest
  return sortedWidths[sortedWidths.length - 1];
}

/**
 * Calculate total sheet metal length from segments
 * This is the sum of all segment lengths and determines the required strip width
 */
function calculateTotalSheetMetalLengthInches(segments: Segment[]): number {
  if (segments.length === 0) return 0;

  // Sum all segment lengths
  const totalLengthPixels = segments.reduce((sum, segment) => sum + segment.length, 0);
  
  // Always convert to inches for pricing/constraints
  return convertFromPixels(totalLengthPixels, 'inch');
}

function getMaxAllowedWidthInches(material: Material): number {
  const maxAllowedFromList = material.allowedWidths.length > 0
    ? Math.max(...material.allowedWidths)
    : material.sheetWidth;
  return Math.min(material.sheetWidth, maxAllowedFromList);
}

function detectBendAngles(points: Point[], segments: Segment[]): number[] {
  if (points.length === 0 || segments.length < 2) return [];

  const pointsById = new Map<string, Point>();
  for (const p of points) pointsById.set(p.id, p);

  const segmentsByPoint = new Map<string, Segment[]>();
  const add = (pointId: string, seg: Segment) => {
    const existing = segmentsByPoint.get(pointId);
    if (existing) existing.push(seg);
    else segmentsByPoint.set(pointId, [seg]);
  };

  for (const seg of segments) {
    add(seg.startPointId, seg);
    add(seg.endPointId, seg);
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

  const angles: number[] = [];
  for (const [pointId, connected] of segmentsByPoint.entries()) {
    if (connected.length !== 2) continue;
    const v1 = vectorForSegmentAtPoint(connected[0], pointId);
    const v2 = vectorForSegmentAtPoint(connected[1], pointId);
    if (!v1 || !v2) continue;
    const angle = angleBetween(v1, v2);
    if (angle === null) continue;
    if (angle <= 0.001 || angle >= 179.999) continue;
    angles.push(angle);
  }

  return angles;
}

function calculateDevelopedWidthInches(segments: Segment[], points: Point[], material: Material): number {
  const straightInches = calculateTotalSheetMetalLengthInches(segments);
  const bendAngles = detectBendAngles(points, segments);
  if (bendAngles.length === 0) return straightInches;

  // Use material thickness/kFactor in inches
  const thickness = material.thicknessInches;
  const kFactor = material.kFactor;
  if (!thickness || !kFactor) return straightInches;

  const totalBendAllowance = bendAngles.reduce((sum, angle) => {
    const bend = calculateBendAllowance(angle, thickness, kFactor);
    return sum + bend.bendAllowance;
  }, 0);

  return straightInches + totalBendAllowance;
}

/**
 * Calculate product price based on new pricing algorithm
 */
export function calculateProductPrice(
  segments: Segment[],
  points: Point[],
  material: Material | null,
  productType: ProductType,
  pricingConfig: PricingConfig,
  unit: 'inch' | 'mm' = 'inch'
): PriceCalculation {
  // Default values if no data
  if (!material || segments.length === 0 || points.length === 0) {
    return {
      materialCost: 0,
      laborCost: 0,
      setupFee: 0,
      subtotal: 0,
      profitMargin: pricingConfig.profitMargin,
      profitAmount: 0,
      totalCost: 0,
      totalCostPerUnit: 0,
      quantity: pricingConfig.quantity,
      requiredWidth: 0,
      chargedWidth: 0,
      stripLength: 10,
      sheetFraction: 0,
      maxAllowedWidth: 0,
      isWidthExceeded: false,
    };
  }

  // Calculate developed required width from the 2D sketch (inches only)
  // Includes bend allowance (neutral axis) when possible.
  void unit;
  const requiredWidth = calculateDevelopedWidthInches(segments, points, material);
  const maxAllowedWidth = getMaxAllowedWidthInches(material);
  const isWidthExceeded = requiredWidth > maxAllowedWidth + 1e-6;

  // Hard stop: cannot manufacture beyond max width
  if (isWidthExceeded) {
    return {
      materialCost: 0,
      laborCost: 0,
      setupFee: 0,
      subtotal: 0,
      profitMargin: pricingConfig.profitMargin,
      profitAmount: 0,
      totalCost: 0,
      totalCostPerUnit: 0,
      quantity: pricingConfig.quantity,
      requiredWidth,
      chargedWidth: maxAllowedWidth,
      stripLength: 10,
      sheetFraction: maxAllowedWidth / material.sheetWidth,
      maxAllowedWidth,
      isWidthExceeded,
    };
  }

  // Find the charged width (next allowed width up, accounting for waste)
  const chargedWidth = findChargedWidth(requiredWidth, material.allowedWidths);

  // Calculate what fraction of the sheet we're using
  const sheetFraction = chargedWidth / material.sheetWidth;

  // Material cost = sheet price × fraction used
  const materialCost = material.sheetPrice * sheetFraction;

  // Labor cost based on product type
  const laborCostConfig = pricingConfig.laborCosts.find(
    lc => lc.productType === productType
  );
  const laborCost = laborCostConfig ? laborCostConfig.costPerUnit : 3;

  // Setup fee - only if quantity <= 10
  const setupFee = pricingConfig.quantity > 10 ? 0 : pricingConfig.setupFee;

  // Cost per unit
  const costPerUnit = materialCost + laborCost;

  // Total cost for all units before margin
  const totalBeforeMargin = (costPerUnit * pricingConfig.quantity) + setupFee;

  // Calculate profit margin on total
  const profitAmount = totalBeforeMargin * (pricingConfig.profitMargin / 100);

  // Total cost including margin
  const totalCost = totalBeforeMargin + profitAmount;

  // Cost per unit (including setup fee distributed and margin)
  const totalCostPerUnit = totalCost / pricingConfig.quantity;

  return {
    materialCost,
    laborCost,
    setupFee,
    subtotal: totalBeforeMargin,
    profitMargin: pricingConfig.profitMargin,
    profitAmount,
    totalCost,
    totalCostPerUnit,
    quantity: pricingConfig.quantity,
    requiredWidth,
    chargedWidth,
    stripLength: 10, // Always 10 feet
    sheetFraction,
    maxAllowedWidth,
    isWidthExceeded,
  };
}

/**
 * Format price for display
 */
export function formatPrice(price: number, currency: 'USD' | 'EUR' | 'PLN' = 'USD'): string {
  const symbols = {
    USD: '$',
    EUR: '€',
    PLN: 'zł',
  };

  return `${symbols[currency]}${price.toFixed(2)}`;
}
