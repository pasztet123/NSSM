import { Material } from '../types';

export const materials: Material[] = [
  {
    id: 'copper-16oz',
    name: '16 oz Copper (36"x120")',
    type: 'copper',
    thickness: '16 oz',
    thicknessInches: 0.0216,
    kFactor: 0.40,
    sheetPrice: 242,
    sheetWidth: 36, // 3 feet
    sheetLength: 120, // 10 feet
    allowedWidths: [3, 4, 6, 9, 12, 18, 36],
    weight: 1.0,
    color: '#B87333',
  },
  {
    id: 'copper-16oz-24x120',
    name: '16 oz Copper (24"x120")',
    type: 'copper',
    thickness: '16 oz',
    thicknessInches: 0.0216,
    kFactor: 0.40,
    sheetPrice: 163,
    sheetWidth: 24, // 2 feet
    sheetLength: 120, // 10 feet
    allowedWidths: [3, 4, 6, 8, 12, 24],
    weight: 1.0,
    color: '#B87333',
  },
  {
    id: 'steel-24ga-kynar',
    name: '24 Ga Kynar Steel',
    type: 'steel',
    thickness: '24 Ga',
    thicknessInches: 0.0276,
    kFactor: 0.44,
    finish: 'Kynar',
    sheetPrice: 90,
    sheetWidth: 48, // 4 feet
    sheetLength: 120, // 10 feet
    allowedWidths: [3, 4, 6, 9.6, 12, 16, 24, 48],
    weight: 0.75,
    color: '#8B9198',
  },
  {
    id: 'aluminum-032-kynar',
    name: '0.032" Kynar Aluminum',
    type: 'aluminum',
    thickness: '0.032"',
    thicknessInches: 0.032,
    kFactor: 0.33,
    finish: 'Kynar',
    sheetPrice: 126.5,
    sheetWidth: 48, // 4 feet
    sheetLength: 120, // 10 feet
    allowedWidths: [3, 4, 6, 9.6, 12, 16, 24, 48],
    weight: 0.45,
    color: '#C0C0C0',
  },
];
