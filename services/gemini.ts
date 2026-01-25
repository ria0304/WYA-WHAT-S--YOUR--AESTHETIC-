
import { api } from './api';

/**
 * VISION SERVICE - LOCAL ML BRIDGE
 * Redirects frontend requests to the Python Local Computer Vision Engine.
 */
export async function analyzeImageWithVision(base64: string) {
  try {
    // Call the local backend API instead of Google Gemini
    const response = await api.wardrobe.scanFabric(base64);
    
    if (response && response.success) {
      return {
        name: response.name,
        category: response.category,
        color: response.color,
        fabric: response.fabric,
        details: response.details,
        bestColor: response.best_color
      };
    }
    throw new Error("Local analysis failed");
  } catch (err) {
    console.error("Local ML Bridge failed", err);
    // Fallback Mock if API is completely down
    return {
      name: "Unidentified Item",
      category: "Top",
      color: "Neutral",
      fabric: "Unknown",
      details: "Could not connect to analysis engine.",
      bestColor: "Blue"
    };
  }
}

/**
 * VACATION PLANNER - LOCAL RULES ENGINE BRIDGE
 */
export async function generateTripPlan(city: string, days: number, vibe: string) {
  try {
    // Call local backend API
    const response = await api.ai.getVacationPlan(vibe, days, city);
    return response;
  } catch (err) {
    console.error("Trip planning failed", err);
    throw new Error("Could not curate trip plan.");
  }
}

/**
 * STYLING INSPIRATION - LOCAL STYLIST BRIDGE
 */
export async function getInspirationWithVision(base64: string) {
  try {
    const response = await api.wardrobe.outfitMatch(base64, 0);
    return {
      vibe: response.vibe,
      identifiedItem: response.identified_item,
      match_piece: response.match_piece,
      jewelry: response.jewelry,
      shoes: response.shoes,
      bag: response.bag,
      bestColor: response.best_color
    };
  } catch (err) {
    console.error("Local Aesthetic match failed", err);
    return null;
  }
}

// Proxies for compatibility
export const getWeatherAnalysis = async (city: string) => {
  const data = await api.ai.getWeather(city);
  return {
    temperature: data.temp,
    condition: data.condition,
    stylingAdvice: data.advice || data.outfit?.advice
  };
};

export const checkBrandSustainability = async (brandName: string) => {
  const data = await api.ai.getGreenAudit(brandName);
  return { text: data.summary, sources: data.sources || [] };
};

export const getCityShops = async (city: string) => {
   // Stub for compatibility
   return [];
};
