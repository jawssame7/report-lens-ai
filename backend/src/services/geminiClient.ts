import { GoogleGenerativeAI } from '@google/generative-ai';
import { Insight, MetricPoint } from '../types/analysis';
import { serverConfig, isGeminiConfigured } from '../config';

interface GeminiAnalysisResult {
  metrics: MetricPoint[];
  insights: Insight[];
}

// Gemini APIクライアントの初期化
let genAI: GoogleGenerativeAI | null = null;

const getGenAI = (): GoogleGenerativeAI => {
  if (!genAI && isGeminiConfigured()) {
    const apiKey = serverConfig.gemini.apiKey;
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  if (!genAI) {
    throw new Error('Gemini API is not configured');
  }
  return genAI;
};

const buildPrompt = (text: string): string => `あなたは財務分析の専門家です。以下のビジネスレポートを分析し、主要な財務項目と重要なインサイトを抽出してください。

## 抽出する情報
1. **主要財務項目**（必須）：
   - 売上高（売上、売上高、営業収益など）
   - 販管費（販売費及び一般管理費、販管費など）
   - 経常利益（経常利益）
   - 純利益（当期純利益、税引後当期純利益など）

2. **インサイト**（3～5個）：
   - 収益性、財務健全性、成長性、リスク要因、機会など

## 出力形式
JSON形式で出力してください：
\`\`\`json
{
  "metrics": [
    {
      "id": "revenue",
      "label": "売上高",
      "currentValue": 120000000,
      "unit": "円"
    },
    {
      "id": "sga",
      "label": "販管費",
      "currentValue": 45000000,
      "unit": "円"
    },
    {
      "id": "ordinary-profit",
      "label": "経常利益",
      "currentValue": 15000000,
      "unit": "円"
    },
    {
      "id": "net-profit",
      "label": "純利益",
      "currentValue": 10000000,
      "unit": "円"
    }
  ],
  "insights": [
    {
      "id": "insight-1",
      "title": "インサイトのタイトル（簡潔に20文字以内）",
      "description": "具体的な数値や根拠を含めた詳細説明（100文字程度）",
      "severity": "critical|warning|info"
    }
  ]
}
\`\`\`

## 重要事項
- 主要財務項目は必ず4項目（売上高、販管費、経常利益、純利益）を抽出してください
- 数値が見つからない場合は0を設定してください
- 金額の単位は「円」で統一してください（千円、百万円表記の場合は円に換算）
- すべて日本語で記述してください
- JSON以外の説明文は出力しないでください

---

分析対象テキスト：
${text.slice(0, 8000)}`;

const fallbackResult = (text: string): GeminiAnalysisResult => {
  const fallbackMetrics: MetricPoint[] = [
    { id: 'revenue', label: '売上高', currentValue: 0, direction: 'flat', unit: '円' },
    { id: 'sga', label: '販管費', currentValue: 0, direction: 'flat', unit: '円' },
    { id: 'ordinary-profit', label: '経常利益', currentValue: 0, direction: 'flat', unit: '円' },
    { id: 'net-profit', label: '純利益', currentValue: 0, direction: 'flat', unit: '円' }
  ];

  if (!text.trim()) {
    return {
      metrics: fallbackMetrics,
      insights: [
        {
          id: 'insight-empty',
          title: 'OCR/解析が必要です',
          description: 'このファイルにはOCRまたは外部解析が必要です。GEMINI_API_KEYを設定してAI抽出を有効にしてください。',
          severity: 'warning'
        }
      ]
    };
  }

  return {
    metrics: fallbackMetrics,
    insights: [
      {
        id: 'insight-trend',
        title: '安定したパフォーマンスを検出',
        description: 'メトリクスは一貫しているように見えますが、より深いAI分析を有効にするためにGEMINI_API_KEYを設定してください。',
        severity: 'info'
      }
    ]
  };
};

export const requestGeminiAnalysis = async (text: string): Promise<GeminiAnalysisResult> => {
  if (!isGeminiConfigured()) {
    return fallbackResult(text);
  }

  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: serverConfig.gemini.model });

    const result = await model.generateContent(buildPrompt(text));
    const response = result.response;
    const generatedText = response.text();

    if (!generatedText) {
      return fallbackResult(text);
    }

    // JSONオブジェクトを抽出（配列ではなくオブジェクト形式）
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('No JSON found in Gemini response');
      return fallbackResult(text);
    }

    const parsed = JSON.parse(jsonMatch[0]) as GeminiAnalysisResult;

    // metricsとinsightsの検証
    if (!parsed.metrics || !Array.isArray(parsed.metrics)) {
      parsed.metrics = fallbackResult(text).metrics;
    }
    if (!parsed.insights || !Array.isArray(parsed.insights)) {
      parsed.insights = fallbackResult(text).insights;
    }

    return {
      metrics: parsed.metrics,
      insights: parsed.insights.slice(0, 5)
    };
  } catch (error) {
    console.error('Gemini API error', error);
    return fallbackResult(text);
  }
};

// 後方互換性のため、insightsのみを返す関数も残す
export const requestGeminiInsights = async (text: string): Promise<Insight[]> => {
  const result = await requestGeminiAnalysis(text);
  return result.insights;
};
