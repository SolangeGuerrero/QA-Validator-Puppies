// Fake but realistic Argentine pet food data for the Puppies portfolio demo.
// All numbers, codes and copy are invented but follow real SENASA / EAN-13 formats.

export interface DemoProduct {
  sku: string
  name: string
  brand: string
  category: string
  variant: string
  lifeStage: string
  packWeight: string
  // Reference document content
  ingredients: string[]
  nutrition: {
    crude_protein_min_pct: number
    crude_fat_min_pct: number
    crude_fiber_max_pct: number
    moisture_max_pct: number
    ash_max_pct: number
    calcium_min_pct: number
    phosphorus_min_pct: number
    metabolizable_energy_kcal_per_kg: number
  }
  senasaReg: string
  ean13: string
  sapCode: string
  // 2-3 deliberate discrepancies for the AI to find on the artwork
  // (the artwork generator uses these to render wrong values vs the reference doc)
  artworkErrors: {
    front?: string[]
    back?: string[]
    side?: string[]
  }
}

// EAN-13 check digit calculator (real algorithm — produces valid barcodes)
function ean13(prefix12: string): string {
  if (prefix12.length !== 12) throw new Error('EAN prefix must be 12 digits')
  let sum = 0
  for (let i = 0; i < 12; i++) sum += Number(prefix12[i]) * (i % 2 === 0 ? 1 : 3)
  const check = (10 - (sum % 10)) % 10
  return prefix12 + check
}

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    sku: 'PUP-CHK-001',
    name: 'Puppies Chicken Recipe',
    brand: 'Puppies',
    category: 'Cachorros Razas Pequeñas',
    variant: 'Pollo',
    lifeStage: 'Cachorros 2-12 meses',
    packWeight: '3 kg',
    ingredients: [
      'Pollo fresco', 'Harina de pollo', 'Arroz integral', 'Maíz', 'Avena',
      'Grasa de pollo', 'Pulpa de remolacha', 'Harina de pescado', 'Aceite de salmón',
      'Linaza', 'Levadura de cerveza', 'Cloruro de potasio', 'Sal',
      'Vitaminas A, D3, E', 'Minerales (zinc, hierro, cobre, manganeso)',
    ],
    nutrition: {
      crude_protein_min_pct: 30,
      crude_fat_min_pct: 18,
      crude_fiber_max_pct: 3.5,
      moisture_max_pct: 10,
      ash_max_pct: 8,
      calcium_min_pct: 1.2,
      phosphorus_min_pct: 1.0,
      metabolizable_energy_kcal_per_kg: 3850,
    },
    senasaReg: 'A.18432',
    ean13: ean13('779001000010'),
    sapCode: 'SAP-101001',
    artworkErrors: {
      front: ['SENASA number typo: A.18342 instead of A.18432'],
      back:  ['Crude protein wrong: 28% vs reference 30%'],
      side:  ['Missing storage instructions'],
    },
  },
  {
    sku: 'PUP-LMB-002',
    name: 'Puppies Lamb & Rice',
    brand: 'Puppies',
    category: 'Cachorros Razas Medianas',
    variant: 'Cordero y Arroz',
    lifeStage: 'Cachorros 2-12 meses',
    packWeight: '7.5 kg',
    ingredients: [
      'Cordero deshidratado', 'Arroz', 'Harina de pollo', 'Maíz molido', 'Sorgo',
      'Pulpa de remolacha', 'Grasa animal estabilizada', 'Hidrolizado de pollo',
      'Aceite de pescado', 'Cloruro de sodio', 'Fosfato bicálcico', 'Levadura de cerveza',
      'Manano-oligosacáridos', 'Vitaminas y minerales', 'Antioxidantes naturales (mixto tocoferoles)',
    ],
    nutrition: {
      crude_protein_min_pct: 27,
      crude_fat_min_pct: 16,
      crude_fiber_max_pct: 4,
      moisture_max_pct: 10,
      ash_max_pct: 8.5,
      calcium_min_pct: 1.1,
      phosphorus_min_pct: 0.9,
      metabolizable_energy_kcal_per_kg: 3700,
    },
    senasaReg: 'A.18433',
    ean13: ean13('779001000011'),
    sapCode: 'SAP-101002',
    artworkErrors: {
      front: ['EAN code wrong digit in position 7'],
      back:  ['Crude fat declared as 18% vs reference 16%'],
    },
  },
  {
    sku: 'PUP-SLM-003',
    name: 'Puppies Salmon Formula',
    brand: 'Puppies',
    category: 'Cachorros Razas Grandes',
    variant: 'Salmón',
    lifeStage: 'Cachorros 2-15 meses',
    packWeight: '15 kg',
    ingredients: [
      'Salmón fresco', 'Harina de salmón', 'Arroz integral', 'Cebada', 'Avena',
      'Aceite de salmón', 'Linaza', 'Pulpa de remolacha', 'Hidrolizado de hígado',
      'Levadura de cerveza', 'Glucosamina', 'Sulfato de condroitina',
      'Cloruro de potasio', 'Vitaminas A, D3, E, C', 'Minerales quelados',
    ],
    nutrition: {
      crude_protein_min_pct: 26,
      crude_fat_min_pct: 14,
      crude_fiber_max_pct: 4.5,
      moisture_max_pct: 10,
      ash_max_pct: 8,
      calcium_min_pct: 1.0,
      phosphorus_min_pct: 0.85,
      metabolizable_energy_kcal_per_kg: 3650,
    },
    senasaReg: 'A.18434',
    ean13: ean13('779001000012'),
    sapCode: 'SAP-101003',
    artworkErrors: {
      front: ['Brand name typo: "Pupies" instead of "Puppies"'],
      side:  ['SAP code missing'],
    },
  },
  {
    sku: 'PUP-SNS-004',
    name: 'Puppies Sensitive Tummy',
    brand: 'Puppies',
    category: 'Dietas Especiales',
    variant: 'Pavo y Arroz',
    lifeStage: 'Cachorros 2-12 meses',
    packWeight: '3 kg',
    ingredients: [
      'Pavo deshidratado', 'Arroz', 'Avena', 'Pulpa de remolacha', 'Hidrolizado de pavo',
      'Aceite de pescado', 'Linaza', 'Calabaza deshidratada', 'Mananos-oligosacáridos',
      'Fructo-oligosacáridos', 'Levadura inactivada', 'Cloruro de potasio',
      'Vitamina E', 'Vitaminas A, D3', 'Minerales quelados',
    ],
    nutrition: {
      crude_protein_min_pct: 25,
      crude_fat_min_pct: 13,
      crude_fiber_max_pct: 5,
      moisture_max_pct: 10,
      ash_max_pct: 7.5,
      calcium_min_pct: 1.0,
      phosphorus_min_pct: 0.8,
      metabolizable_energy_kcal_per_kg: 3500,
    },
    senasaReg: 'A.18435',
    ean13: ean13('779001000013'),
    sapCode: 'SAP-101004',
    artworkErrors: {
      back: ['Storage instructions in different wording vs reference doc'],
      side: ['Ingredient "Linaza" listed but missing from artwork'],
    },
  },
  {
    sku: 'PUP-SMB-005',
    name: 'Puppies Small Breed',
    brand: 'Puppies',
    category: 'Cachorros Razas Pequeñas',
    variant: 'Pollo y Cereales',
    lifeStage: 'Cachorros razas pequeñas hasta 10 meses',
    packWeight: '1.5 kg',
    ingredients: [
      'Pollo fresco', 'Harina de pollo', 'Arroz', 'Maíz', 'Harina de gluten de maíz',
      'Grasa de pollo', 'Pulpa de remolacha', 'Hidrolizado de pollo',
      'Aceite de salmón', 'Levadura de cerveza', 'Cloruro de potasio',
      'Fosfato monocálcico', 'Vitaminas A, D3, E', 'Minerales (zinc, hierro, cobre)',
      'Extracto de yucca schidigera',
    ],
    nutrition: {
      crude_protein_min_pct: 32,
      crude_fat_min_pct: 20,
      crude_fiber_max_pct: 3,
      moisture_max_pct: 10,
      ash_max_pct: 8,
      calcium_min_pct: 1.3,
      phosphorus_min_pct: 1.1,
      metabolizable_energy_kcal_per_kg: 4000,
    },
    senasaReg: 'A.18436',
    ean13: ean13('779001000014'),
    sapCode: 'SAP-101005',
    artworkErrors: {
      front: ['Pack weight printed as 1.0 kg vs reference 1.5 kg'],
      back:  ['Metabolizable energy declared as 3800 vs reference 4000 kcal/kg'],
    },
  },
]

export const LEGAL_TEXT = {
  storage: 'Mantener el envase cerrado, en lugar fresco y seco. Una vez abierto, consumir en un plazo de 30 días.',
  feeding: 'Consultá la tabla de raciones diarias. Proveer agua fresca y limpia siempre disponible.',
  warning: 'Producto destinado exclusivamente a la alimentación de perros. No apto para consumo humano.',
  manufacturer: 'Elaborado por Puppies S.A. — Av. Demo 1234, CABA, Argentina.',
}
