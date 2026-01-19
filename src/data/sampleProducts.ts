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
    basePrice: 0,
    currency: 'USD',
    images: [
      'https://lnfzvpaonuzbcnlulyyk.supabase.co/storage/v1/object/public/product-images/public/coping-cap-1768506491777.png',
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
    model3D: undefined,
    model3DId: 'e9895a09-3635-4e77-8bf2-ef7b60f10765', // Database model ID
    model3DRotation: [0, 0, Math.PI / 2], // Default rotation (90° around Z-axis)
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
    basePrice: 0,
    currency: 'USD',
    images: [
      'https://lnfzvpaonuzbcnlulyyk.supabase.co/storage/v1/object/public/product-images/public/d-drip-edge-1768507472717.png',
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
    model3D: undefined,
    model3DId: '735ff491-a648-4fa1-a750-4eb4d39bb33e', // Database model ID
    model3DRotation: [0, 0, Math.PI / 2], // Default rotation (90° around Z-axis)
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
    basePrice: 0,
    currency: 'USD',
    images: [
      'https://lnfzvpaonuzbcnlulyyk.supabase.co/storage/v1/object/public/product-images/public/t-drip-edge-1768506999644.png',
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
    model3D: undefined,
    model3DId: '4a0e04fb-82ef-43be-946d-389665fa7584', // Database model ID
    model3DRotation: [0, 0, Math.PI / 2], // Default rotation (90° around Z-axis)
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
    basePrice: 0,
    currency: 'USD',
    images: [
      'https://lnfzvpaonuzbcnlulyyk.supabase.co/storage/v1/object/public/product-images/public/gutter-apron-1768508663970.png',
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
    model3D: undefined,
    model3DId: '4d7df420-5b8d-4e9e-85c1-846906e65abd', // Database model ID
    model3DRotation: [0, 0, Math.PI / 2], // Default rotation (90° around Z-axis)
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
    basePrice: 0,
    currency: 'USD',
    images: [
      'https://lnfzvpaonuzbcnlulyyk.supabase.co/storage/v1/object/public/product-images/public/valley-flashing-1768508161506.png',
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
    model3D: sampleModels[0], // Valley model (fallback)
    model3DId: '564e8cae-d431-419f-b435-19a76b384592', // Database model ID
    model3DRotation: [0, 0, Math.PI / 2], // Default rotation (90° around Z-axis)
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
    basePrice: 0,
    currency: 'USD',
    images: [
      'https://lnfzvpaonuzbcnlulyyk.supabase.co/storage/v1/object/public/product-images/public/roof-wall-1768506644958.png',
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
    model3D: undefined,
    model3DId: 'e5a5e3d3-4e76-4b53-a81d-e5d87fb2cdfb', // Database model ID
    model3DRotation: [0, 0, Math.PI / 2], // Default rotation (90° around Z-axis)
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
    basePrice: 0,
    currency: 'USD',
    images: [
      'https://lnfzvpaonuzbcnlulyyk.supabase.co/storage/v1/object/public/product-images/public/z-closure-1768506840210.png',
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
    model3D: undefined,
    model3DId: '3f639583-96e2-4c08-9cd5-7124211704de', // Database model ID
    model3DRotation: [0, 0, Math.PI / 2], // Default rotation (90° around Z-axis)
    selectedMaterial: 'aluminum-032-kynar', // Default material
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-8',
    name: 'Gravel Stop Drip Edge',
    category: 'Drip Edge',
    productType: 'gravel-stop',
    description: 'Gravel stop edge for flat and low-slope roofs',
    longDescription: 'Gravel stop drip edge is designed for flat and low-slope roofs with gravel or ballast. Provides a raised edge to contain loose roofing material while directing water runoff away from the building.',
    basePrice: 0,
    currency: 'USD',
    images: [
      'https://lnfzvpaonuzbcnlulyyk.supabase.co/storage/v1/object/public/product-images/public/gravel-stop-1768507213308.png',
      '/images/products/gravel-stop-2.jpg',
    ],
    specifications: {
      material: 'Galvanized Steel / Aluminum',
      thickness: '24 gauge (0.024")',
      finish: 'Mill Finish / Painted',
      color: 'Custom colors available',
      profile: 'Gravel Stop',
      width: '4" - 8"',
      length: '10 ft standard',
    },
    model3D: undefined,
    model3DId: '19db0e4d-e05c-4b87-8f8e-ed303814679c', // Database model ID
    model3DRotation: [0, 0, Math.PI / 2], // Default rotation (90° around Z-axis)
    selectedMaterial: 'steel-24ga-kynar', // Default material
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-9',
    name: 'J Channel Flashing',
    category: 'Accessories',
    productType: 'j-channel',
    description: 'J-channel trim for siding and wall transitions',
    longDescription: 'J-channel flashing provides a clean finished edge for vinyl siding, window trim, and wall transitions. Creates a professional appearance while protecting edges from moisture infiltration.',
    basePrice: 0,
    currency: 'USD',
    images: [
      'https://lnfzvpaonuzbcnlulyyk.supabase.co/storage/v1/object/public/product-images/public/j-channel-1768507714740.png',
      '/images/products/j-channel-2.jpg',
    ],
    specifications: {
      material: 'Galvanized Steel / Aluminum',
      thickness: '26 gauge (0.019")',
      finish: 'Mill Finish / Painted',
      color: 'Custom colors available',
      profile: 'J-Channel',
      width: '3/4" - 1"',
      length: '10 ft standard',
    },
    model3D: undefined,
    model3DId: 'b1973377-4111-4496-9b61-4fb35cb50084', // Database model ID
    model3DRotation: [0, 0, Math.PI / 2], // Default rotation (90° around Z-axis)
    selectedMaterial: 'aluminum-032-kynar', // Default material
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
