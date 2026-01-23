import { GoogleGenAI } from "@google/genai";
import { TOOL_CATEGORIES, Subscription } from "../types";

// WICHTIG: Zugriff über import.meta.env für Vite!
const apiKey = import.meta.env.VITE_API_KEY || '';

// Initialisierung nur, wenn ein Key da ist, um Abstürze beim Laden zu verhindern
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const suggestToolDetails = async (toolName: string) => {
  if (!ai) {
    console.error("Gemini API Key fehlt.");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Gib eine Kategorisierung und eine kurze Beschreibung für das Software-Tool namens: ${toolName} auf Deutsch an. 
      Wähle für die Kategorie UNBEDINGT einen der folgenden Werte aus: ${TOOL_CATEGORIES.join(', ')}.
      Schätze die monatlichen Kosten in EURO.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            category: { type: "string" },
            description: { type: "string" },
            estimatedMonthlyCost: { type: "number" },
            url: { type: "string" }
          },
          required: ["category", "description", "estimatedMonthlyCost", "url"]
        }
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("KI-Vorschlag fehlgeschlagen:", error);
    return null;
  }
};

export const analyzeInvoice = async (base64Data: string, mimeType: string) => {
  if (!ai) return null;
  try {
    const imagePart = {
      inlineData: {
        data: base64Data.split(',')[1],
        mimeType: mimeType,
      },
    };
    const textPart = {
      text: `Analysiere diese Rechnung und extrahiere die Daten für unser SaaS-Tracking Tool. 
      Wähle für die Kategorie UNBEDINGT einen der folgenden Werte aus: ${TOOL_CATEGORIES.join(', ')}.
      Gib das Ergebnis als JSON zurück.`
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            category: { type: "string" },
            monthlyCost: { type: "number" },
            renewalDate: { type: "string", description: "Datum im Format YYYY-MM-DD" },
            description: { type: "string" }
          },
          required: ["name", "category", "monthlyCost", "renewalDate"]
        }
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Rechnungs-Analyse fehlgeschlagen:", error);
    return null;
  }
};

export const auditStack = async (subscriptions: Subscription[]) => {
  if (!ai) return "Analyse derzeit nicht möglich (Kein API Key).";

  const toolList = subscriptions.map(s => `- ${s.name} (${s.category}): ${s.monthlyCost}€/Monat`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Du bist ein erfahrener IT-Einkäufer und SaaS-Optimierer. Analysiere folgende Liste von Firmen-Software auf Überschneidungen, Einsparpotenziale und Redundanzen (z.B. zwei Videokonferenz-Tools). Gib konkrete, kurze Empfehlungen auf Deutsch:
      
      ${toolList}
      
      Strukturiere deine Antwort mit:
      ### 🚩 Redundanzen & Warnungen
      ### 💡 Optimierungschancen
      ### 💶 Geschätztes Sparpotenzial`,
    });

    return response.text;
  } catch (error) {
    console.error("Stack Audit fehlgeschlagen:", error);
    return "Fehler bei der Analyse des Stacks.";
  }
};