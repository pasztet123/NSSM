import { Product } from '../types';
import { sampleModels } from './sampleModels';

export const sampleProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Coping Cap Flashing',
    category: 'Roof Flashing',
    productType: 'coping-cap',
    description: 'Protective cap flashing for parapet walls and roof edges',
    longDescription: 'Coping cap flashing provides a weather-tight seal over parapet walls and roof edges, protecting the underlying structure from water infiltration. Available in various profiles and materials to match your architectural design.',
    basePrice: 12.50,
    currency: 'USD',
    images: [
      '/images/products/coping-cap-1.jpg',
      '/images/products/coping-cap-2.jpg',
    ],
    specifications: {
      material: 'Galvanized Steel / Aluminum / Copper',
      thickness: '24 gauge (0.024")',
      finish: 'Mill Finish / Painted / Kynar',
      color: 'Custom colors available',
      width: '12" - 24" standard',
      application: 'Parapet walls, roof edges',
    },
    model3D: sampleModels[0], // Rectangular Sheet
    selectedMaterial: 'steel-24ga-kynar', // Default material
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    name: 'D-Style Drip Edge Flashing',
    category: 'Drip Edge',
    productType: 'd-style',
    description: 'Classic D-style drip edge for standard roof applications',
    longDescription: 'The D-style drip edge is the most common profile, providing excellent water runoff protection. Its distinctive D-shaped profile directs water away from fascia boards and into gutters.',
    basePrice: 3.75,
    currency: 'USD',
    images: [
      '/images/products/d-drip-edge-1.jpg',
      '/images/products/d-drip-edge-2.jpg',
    ],
    specifications: {
      material: 'Galvanized Steel / Aluminum',
      thickness: '26 gauge (0.019")',
      finish: 'Mill Finish / Painted',
      color: 'White, Brown, Black, Custom',
      profile: 'D-Style',
      width: '2" - 4"',
      length: '10 ft standard',
    },
    model3D: sampleModels[1], // L-Profile
    selectedMaterial: 'aluminum-032-kynar', // Default material
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    name: 'T-Style Drip Edge Flashing',
    category: 'Drip Edge',
    productType: 't-style',
    description: 'T-style drip edge for tile and specialty roof applications',
    longDescription: 'T-style drip edge is specifically designed for tile roofs and high-end applications where a more robust edge detail is required. The T-profile provides additional strength and a clean aesthetic.',
    basePrice: 4.25,
    currency: 'USD',
    images: [
      '/images/products/t-drip-edge-1.jpg',
      '/images/products/t-drip-edge-2.jpg',
    ],
    specifications: {
      material: 'Galvanized Steel / Aluminum / Copper',
      thickness: '24 gauge (0.024")',
      finish: 'Mill Finish / Painted / Kynar',
      color: 'Custom colors available',
      profile: 'T-Style',
      width: '3" - 5"',
      length: '10 ft standard',
    },
    model3D: sampleModels[2], // T-Profile
    selectedMaterial: 'copper-16oz', // Default material
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    name: 'Drip Edge Flashing',
    category: 'Drip Edge',
    productType: 'd-style',
    description: 'Standard drip edge flashing for general roof protection',
    longDescription: 'General purpose drip edge flashing designed to protect roof edges and direct water into gutters. Suitable for most residential and commercial applications.',
    basePrice: 3.50,
    currency: 'USD',
    images: [
      '/images/products/drip-edge-1.jpg',
      '/images/products/drip-edge-2.jpg',
    ],
    specifications: {
      material: 'Galvanized Steel / Aluminum',
      thickness: '26 gauge (0.019")',
      finish: 'Mill Finish / Painted',
      color: 'Standard colors available',
      width: '2" - 4"',
      length: '10 ft standard',
    },
    model3D: sampleModels[0], // Rectangular Sheet
    selectedMaterial: 'steel-24ga-kynar', // Default material
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    name: 'Valley Flashing',
    category: 'Roof Flashing',
    productType: 'valley',
    description: 'Valley flashing for roof intersections and water channels',
    longDescription: 'Valley flashing is critical for channeling water where two roof planes meet. Our valley flashing is designed for maximum water flow and long-term durability in high-stress areas.',
    basePrice: 8.75,
    currency: 'USD',
    images: [
      '/images/products/valley-flashing-1.jpg',
      '/images/products/valley-flashing-2.jpg',
    ],
    specifications: {
      material: 'Galvanized Steel / Aluminum / Copper',
      thickness: '24 gauge (0.024")',
      finish: 'Mill Finish / Painted / Kynar',
      color: 'Custom colors available',
      width: '12" - 24"',
      profile: 'Open or Closed Valley',
      length: '10 ft standard',
    },
    model3D: sampleModels[1], // L-Profile
    selectedMaterial: 'steel-24ga-kynar', // Default material
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-6',
    name: 'Roof-to-Wall Flashing',
    category: 'Roof Flashing',
    productType: 'roof-to-wall',
    description: 'Flashing for roof-to-wall transitions and penetrations',
    longDescription: 'Roof-to-wall flashing creates a watertight seal where a roof meets a vertical wall. Essential for preventing water infiltration at these critical junctions.',
    basePrice: 7.50,
    currency: 'USD',
    images: [
      '/images/products/roof-wall-1.jpg',
      '/images/products/roof-wall-2.jpg',
    ],
    specifications: {
      material: 'Galvanized Steel / Aluminum / Copper',
      thickness: '24 gauge (0.024")',
      finish: 'Mill Finish / Painted',
      color: 'Custom colors available',
      width: '6" - 12"',
      profile: 'Step or Continuous',
      length: '10 ft standard',
    },
    model3D: sampleModels[2], // T-Profile
    selectedMaterial: 'aluminum-032-kynar', // Default material
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-7',
    name: 'Z-Closure',
    category: 'Accessories',
    productType: 'z-closure',
    description: 'Z-closure trim for metal roof panel ends',
    longDescription: 'Z-closure provides a finished edge for standing seam and metal panel roofs. Prevents wind-driven rain and debris from entering under the roof panels.',
    basePrice: 4.50,
    currency: 'USD',
    images: [
      '/images/products/z-closure-1.jpg',
      '/images/products/z-closure-2.jpg',
    ],
    specifications: {
      material: 'Galvanized Steel / Aluminum',
      thickness: '26 gauge (0.019")',
      finish: 'Mill Finish / Painted',
      color: 'Match to roof panel',
      profile: 'Custom to panel type',
      length: '10 ft standard',
    },
    model3D: sampleModels[0], // Rectangular Sheet
    selectedMaterial: 'aluminum-032-kynar', // Default material
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
