
/**
 * LocalML Service
 * Performs histogram-based analysis for device-side Computer Vision
 */

export interface LocalAnalysis {
  palette: string[];
  shadeNames: string[];
  complexity: 'Simple' | 'Medium' | 'High';
  temperature: 'Warm' | 'Cool' | 'Neutral';
}

/**
 * Couture-focused color dictionary for high-precision fashion naming.
 * Expanded to 50+ colors to prevent mismatched nearest-neighbor lookups.
 * RGB values are calibrated to real-world fabric dyes.
 */
const COLOR_MAP: Record<string, [number, number, number]> = {
  // Whites & Neutrals
  "Optical White": [245, 245, 245],
  "Ivory": [255, 255, 240],
  "Bone": [227, 218, 201],
  "Champagne": [247, 231, 206],
  "Cream": [255, 253, 208],
  "Beige": [245, 245, 220],
  "Stone": [215, 208, 199],
  
  // Grays & Blacks
  "Dove Gray": [169, 169, 169],
  "Charcoal": [54, 69, 79],
  "Obsidian": [35, 35, 35],
  "Slate": [112, 128, 144],
  "Jet Black": [10, 10, 10],
  "Silver": [192, 192, 192],
  "Ash": [178, 190, 181],
  "Pewter": [105, 105, 105],

  // Blues & Denim Specifics
  "Raw Indigo": [21, 27, 141],
  "Vintage Indigo": [71, 102, 150],
  "Washed Cobalt": [95, 129, 157],
  "Mid-Wash Blue": [100, 149, 237],
  "Stone Wash": [176, 196, 222],
  "Midnight Navy": [25, 25, 112],
  "Steel Blue": [70, 130, 180],
  "Sky Azure": [135, 206, 235],
  "Deep Teal": [0, 128, 128],
  "Cyan": [0, 255, 255],
  "Turquoise": [64, 224, 208],
  "Baby Blue": [137, 207, 240],
  "Dusty Blue": [136, 157, 175],

  // Greens & Teals
  "Mint": [189, 252, 201], // Calibrated for garment mint (less neon)
  "Sage": [156, 175, 136],
  "Seafoam": [147, 223, 184],
  "Olive": [128, 128, 0],
  "Forest": [34, 139, 34],
  "Emerald": [80, 200, 120],
  "Lime": [191, 255, 0],
  "Kelly Green": [76, 187, 23],
  "Slate Green": [47, 79, 79],
  "Muted Teal": [95, 158, 160],

  // Earth Tones
  "Camel": [193, 154, 107],
  "Cognac": [154, 70, 61],
  "Sand": [194, 178, 128],
  "Taupe": [135, 124, 113], // Calibrated lighter/grayer
  "Coffee": [111, 78, 55],
  "Espresso": [62, 40, 36],
  "Chocolate": [90, 50, 40],
  "Terracotta": [226, 114, 91],
  "Rust": [183, 65, 14],
  "Brown": [139, 69, 19],
  "Mushroom": [186, 171, 160],
  "Khaki": [189, 183, 107],
  "Mocha": [150, 121, 105],

  // Pinks, Purples & Reds
  "Blush": [255, 228, 225],
  "Rosewood": [101, 0, 11],
  "Bordeaux": [109, 7, 26],
  "Crimson": [153, 0, 0],
  "Red": [255, 0, 0],
  "Soft Peony": [255, 192, 203],
  "Hot Pink": [255, 105, 180],
  "Mauve": [224, 176, 255],
  "Dusty Mauve": [180, 140, 150],
  "Lilac": [200, 162, 200],
  "Lavender": [230, 230, 250],
  "Plum": [142, 69, 133],
  "Violet": [138, 43, 226],
  "Coral": [255, 127, 80],
  "Salmon": [250, 128, 114]
};

const getDistance = (c1: [number, number, number], c2: [number, number, number]) => {
  return Math.sqrt(Math.pow(c1[0]-c2[0], 2) + Math.pow(c1[1]-c2[1], 2) + Math.pow(c1[2]-c2[2], 2));
};

const getColorName = (rgbStr: string, excludedNames: Set<string>): string => {
  const match = rgbStr.match(/\d+/g);
  if (!match) return "Neutral";
  const target = match.map(Number) as [number, number, number];
  
  let candidates: { name: string, dist: number }[] = [];

  for (const [name, rgb] of Object.entries(COLOR_MAP)) {
    const dist = getDistance(target, rgb);
    candidates.push({ name, dist });
  }
  
  candidates.sort((a, b) => a.dist - b.dist);
  
  // Try to find a unique name
  for (const cand of candidates) {
    if (!excludedNames.has(cand.name)) {
      // Safety check: If the "unique" option is vastly different from the best option (dist > 30),
      // we prefer accuracy over uniqueness.
      // Example: If best is Brown (dist 5), but Brown is used, and next is Green (dist 80),
      // we should NOT pick Green. We pick Brown again or a variant.
      const bestDist = candidates[0].dist;
      if (cand.dist > bestDist + 30) {
        return candidates[0].name; // Revert to best match
      }
      return cand.name;
    }
  }
  
  return candidates[0].name;
};

export const analyzeImageLocally = (base64: string): Promise<LocalAnalysis> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve({ palette: [], shadeNames: [], complexity: 'Simple', temperature: 'Neutral' });

      const size = 128;
      
      // Draw only center 60% to canvas to remove background
      const srcX = img.width * 0.2;
      const srcY = img.height * 0.2;
      const srcW = img.width * 0.6;
      const srcH = img.height * 0.6;
      
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, size, size);

      const data = ctx.getImageData(0, 0, size, size).data;
      const bins: Record<string, number> = {};
      let rT = 0, gT = 0, bT = 0;

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const i = (y * size + x) * 4;
          const r = data[i], g = data[i+1], b = data[i+2];
          
          const distFromCenter = Math.sqrt(Math.pow(x - size/2, 2) + Math.pow(y - size/2, 2));
          const maxDist = size / 2;
          const weight = Math.max(0.1, 1 - (distFromCenter / maxDist));

          rT += r * weight; gT += g * weight; bT += b * weight;
          
          const qr = Math.floor(r / 20) * 20;
          const qg = Math.floor(g / 20) * 20;
          const qb = Math.floor(b / 20) * 20;
          const key = `rgb(${qr},${qg},${qb})`;
          bins[key] = (bins[key] || 0) + weight;
        }
      }

      const sortedBins = Object.entries(bins).sort((a, b) => b[1] - a[1]);
      const palette: string[] = [];
      const rawRgbPalette: [number, number, number][] = [];

      for (const [rgbStr] of sortedBins) {
        if (palette.length >= 5) break;
        
        const match = rgbStr.match(/\d+/g);
        if (!match) continue;
        const currentRgb = match.map(Number) as [number, number, number];
        
        const minDistance = 45; // Increased distinctness threshold
        const isTooSimilar = rawRgbPalette.some(p => getDistance(p, currentRgb) < minDistance);
        
        if (!isTooSimilar) {
          palette.push(rgbStr);
          rawRgbPalette.push(currentRgb);
        }
      }

      const usedNames = new Set<string>();
      const shadeNames = palette.map(color => {
        const name = getColorName(color, usedNames);
        usedNames.add(name);
        return name;
      });

      const avgR = rT / (size * size);
      const avgB = bT / (size * size);
      const temperature = avgR > avgB + 10 ? 'Warm' : (avgB > avgR + 10 ? 'Cool' : 'Neutral');

      resolve({ palette, shadeNames, complexity: 'Medium', temperature });
    };
    img.onerror = () => {
      resolve({ palette: [], shadeNames: [], complexity: 'Simple', temperature: 'Neutral' });
    };
  });
};
