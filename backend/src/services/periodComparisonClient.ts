import { GoogleGenerativeAI } from '@google/generative-ai';
import { Insight } from '../types/analysis';
import { serverConfig, isGeminiConfigured } from '../config';

// Gemini APIクライアントの初期化（共通化）
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

/**
 * 複数期間のテキストを比較分析
 */
export const requestPeriodComparisonInsights = async (
  periods: Array<{ periodName: string; text: string }>
): Promise<Insight[]> => {
  if (!isGeminiConfigured() || periods.length < 2) {
    return [];
  }

  const periodTexts = periods
    .map((p, index) => `### ${p.periodName}\n${p.text.slice(0, 4000)}`)
    .join('\n\n');

  const prompt = `あなたは財務分析の専門家です。以下の複数期間のビジネスレポートを比較分析し、以下の2種類のインサイトを生成してください：

1. **各期のトピック**: 各期で最も重要なトピック（1期につき1～2個）
2. **全体サマリー**: 複数期間を通した総合的な評価（2～3個）

## 分析対象期間
${periods.map((p) => `- ${p.periodName}`).join('\n')}

## 出力形式
JSON配列形式で出力してください。各インサイトは以下の構造：

\`\`\`json
[
  {
    "id": "period-topic-20",
    "title": "第20期: 売上増加も利益率低下",
    "description": "売上高は前期比15%増の1.2億円を達成したが、営業利益率は3%低下。コスト管理の強化が必要。",
    "severity": "warning",
    "category": "period-topic",
    "periodName": "第20期"
  },
  {
    "id": "overall-summary-1",
    "title": "継続的な成長トレンドを維持",
    "description": "直近3期間で売上は年平均12%成長。事業拡大が順調に進んでいる。",
    "severity": "info",
    "category": "overall-summary"
  }
]
\`\`\`

## カテゴリの使い分け
- **period-topic**: 特定の期に関するトピック。titleは「第XX期: トピック」形式で、periodNameフィールドも設定
- **overall-summary**: 複数期間を通した総合的な評価や傾向。periodNameフィールドは不要

## severity の基準
- **critical**: 早急な対応が必要（例：大幅な赤字、債務超過）
- **warning**: 注意が必要（例：利益率低下、成長鈍化）
- **info**: ポジティブな情報（例：売上成長、利益率改善）

## 分析の観点
1. **各期のトピック**: 各期で最も特徴的な出来事や変化
2. **収益性トレンド**: 売上・利益の推移パターン
3. **財務健全性**: 資産・負債バランスの変化
4. **リスクと機会**: 注意すべき点と成長機会
5. **総合評価**: 経営状態の全体的な傾向

## 重要事項
- すべて日本語で記述してください
- 具体的な数値と期間名を必ず含めてください
- titleは簡潔に（20文字以内）、descriptionは詳細に（100文字程度）
- JSON以外の説明文は出力しないでください

---

期間別データ：
${periodTexts}`;

  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: serverConfig.gemini.model });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const generatedText = response.text();

    if (!generatedText) {
      return [];
    }

    const jsonMatch = generatedText.match(/\[.*\]/s);
    if (!jsonMatch) {
      console.warn('No JSON array found in period comparison response');
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]) as Insight[];
    return parsed.slice(0, 10);
  } catch (error) {
    console.error('Period comparison API error', error);
    return [];
  }
};
