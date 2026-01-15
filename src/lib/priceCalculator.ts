import { Segment, Material, convertFromPixels, ProductType } from '../types';
import { PricingConfig } from '../data/pricingConfig';

interface PriceCalculation {
  materialCost: number;
  laborCost: number;
  subtotal: number;
  profitMargin: number;
  profitAmount: number;
  totalCost: number;
  requiredWidth: number; // in inches
  chargedWidth: number; // in inches (accounting for waste)
  stripLength: number; // in feet (always 10')
  sheetFraction: number; // fraction of sheet used
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
function calculateTotalSheetMetalLength(
  segments: Segment[],
  unit: 'inch' | 'mm' = 'inch'
): number {
  if (segments.length === 0) return 0;

  // Sum all segment lengths
  const totalLengthPixels = segments.reduce((sum, segment) => sum + segment.length, 0);
  
  // Convert to specified unit (inches by default)
  return convertFromPixels(totalLengthPixels, unit);
}

/**
 * Calculate product price based on new pricing algorithm
 */
export function calculateProductPrice(
  segments: Segment[],
  points: Array<{ x: number; y: number }>,
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
      subtotal: 0,
      profitMargin: pricingConfig.profitMargin,
      profitAmount: 0,
      totalCost: 0,
      requiredWidth: 0,
      chargedWidth: 0,
      stripLength: 10,
      sheetFraction: 0,
    };
  }

  // Calculate required width from the 2D sketch (total sheet metal length)
  const requiredWidth = calculateTotalSheetMetalLength(segments, unit);

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

  // Subtotal before margin
  const subtotal = materialCost + laborCost;

  // Calculate profit margin
  const profitAmount = subtotal * (pricingConfig.profitMargin / 100);

  // Total cost including margin
  const totalCost = subtotal + profitAmount;

  return {
    materialCost,
    laborCost,
    subtotal,
    profitMargin: pricingConfig.profitMargin,
    profitAmount,
    totalCost,
    requiredWidth,
    chargedWidth,
    stripLength: 10, // Always 10 feet
    sheetFraction,
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
