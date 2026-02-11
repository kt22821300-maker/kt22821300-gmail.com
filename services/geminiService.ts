
import { GoogleGenAI, Type } from "@google/genai";
import { Cell, AIHint } from "../types";

export const getAIHint = async (board: Cell[][]): Promise<AIHint | null> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  
  // Create a lightweight representation of the visible board for the prompt
  const boardState = board.map(row => 
    row.map(cell => {
      if (cell.status === 'revealed') return cell.neighborMines;
      if (cell.status === 'flagged') return 'F';
      return '?';
    })
  );

  const prompt = `
    You are a Minesweeper expert. Given the current board state below, identify ONE guaranteed move (either a safe cell to click or a guaranteed mine to flag).
    
    Board Notation:
    - Numbers (0-8): Revealed cells showing count of adjacent mines.
    - 'F': Flagged cells (assumed mines).
    - '?': Hidden cells.

    Current Board:
    ${JSON.stringify(boardState)}

    Return the coordinates (x, y) where x is row and y is column, the type of hint ('safe' or 'mine'), and a brief logical explanation in Korean.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            x: { type: Type.INTEGER, description: 'Row index (0-indexed)' },
            y: { type: Type.INTEGER, description: 'Column index (0-indexed)' },
            type: { type: Type.STRING, enum: ['safe', 'mine'], description: 'Hint type' },
            explanation: { type: Type.STRING, description: 'Brief logical explanation in Korean' }
          },
          required: ['x', 'y', 'type', 'explanation']
        }
      }
    });

    const result = JSON.parse(response.text.trim());
    return result as AIHint;
  } catch (error) {
    console.error("AI Hint Error:", error);
    return null;
  }
};
