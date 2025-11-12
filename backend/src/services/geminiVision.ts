import axios from 'axios';
import { serverConfig, isGeminiConfigured } from '../config';

interface GeminiVisionPayload {
  contents: Array<{
    role: 'user';
    parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }>;
  }>;
}

export const extractTextFromDocument = async (
  documentBase64: string,
  mimeType: string
): Promise<string> => {
  if (!isGeminiConfigured()) {
    return '';
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${serverConfig.gemini.model}:generateContent`;
  const payload: GeminiVisionPayload = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: 'このドキュメントに含まれるすべてのテキストを正確に抽出してください。レイアウトや表の構造を可能な限り保持してください。日本語のテキストはそのまま出力してください。テキストのみを出力し、説明は不要です。'
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: documentBase64
            }
          }
        ]
      }
    ]
  };

  try {
    const { data } = await axios.post(endpoint, payload, {
      params: {
        key: serverConfig.gemini.apiKey
      }
    });

    const extractedText: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return extractedText || '';
  } catch (error) {
    console.error('Gemini Vision API error', error);
    return '';
  }
};

// Backward compatibility
export const extractTextFromImage = extractTextFromDocument;
