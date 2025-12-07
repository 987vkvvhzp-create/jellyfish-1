import { GoogleGenAI, Type } from "@google/genai";
import { JellyfishConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateJellyfishModel = async (prompt: string): Promise<JellyfishConfig> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a configuration for a 3D particle jellyfish based on this mood/description: "${prompt}".
      The output must be a valid JSON object.
      
      Parameters guide:
      - color: Hex code (e.g., #00ffff)
      - coreRadius: 0.5 to 2.0 (size of the bell)
      - tentacleLength: 2.0 to 8.0 (length of trails)
      - tentacleSpread: 0.1 to 1.5 (how wide trails go)
      - particleCount: 1000 to 5000 (density)
      - movementSpeed: 0.1 to 2.0 (animation speed)
      - noiseStrength: 0.1 to 1.0 (turbulence)
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            color: { type: Type.STRING },
            coreRadius: { type: Type.NUMBER },
            tentacleLength: { type: Type.NUMBER },
            tentacleSpread: { type: Type.NUMBER },
            particleCount: { type: Type.NUMBER },
            movementSpeed: { type: Type.NUMBER },
            noiseStrength: { type: Type.NUMBER },
          },
          required: ["name", "description", "color", "coreRadius", "tentacleLength", "tentacleSpread", "particleCount", "movementSpeed", "noiseStrength"],
        },
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        id: crypto.randomUUID(),
        ...data
      };
    }
    throw new Error("No response text");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    // Fallback
    return {
      id: "fallback",
      name: "Deep Sea Ghost",
      description: "A fallback configuration due to API error.",
      color: "#44aaff",
      coreRadius: 1,
      tentacleLength: 4,
      tentacleSpread: 0.5,
      particleCount: 2000,
      movementSpeed: 0.5,
      noiseStrength: 0.3
    };
  }
};
