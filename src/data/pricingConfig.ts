import { LaborCost, ProductType } from '../types';

export const laborCosts: LaborCost[] = [
  {
    productType: 'coping-cap',
    costPerUnit: 5,
  },
  {
    productType: 'z-closure',
    costPerUnit: 3,
  },
  {
    productType: 'd-style',
    costPerUnit: 3,
  },
  {
    productType: 't-style',
    costPerUnit: 3,
  },
  {
    productType: 'valley',
    costPerUnit: 3,
  },
  {
    productType: 'roof-to-wall',
    costPerUnit: 3,
  },
  {
    productType: 'other',
    costPerUnit: 3,
  },
];

export interface PricingConfig {
  profitMargin: number; // Percentage (e.g., 20 for 20%)
  laborCosts: LaborCost[];
}

export const defaultPricingConfig: PricingConfig = {
  profitMargin: 20,
  laborCosts,
};
