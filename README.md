# ReportLensAI

AI を活用して PDF / Office レポートをアップロードするだけで主要財務指標の抽出、期間別比較、AI インサイト作成、履歴管理、エクスポートを自動化するシングルユーザー向け分析アシスタントです。

## アーキテクチャ概要

| レイヤー | 技術 | 役割 |
| --- | --- | --- |
| フロントエンド | React 19 + Vite + TypeScript, TanStack Query, Recharts, lucide-react | マルチファイルアップロード UI、ダッシュボード、期間別比較、エクスポート、履歴閲覧 |
| バックエンド | Node.js (Express 5 + TypeScript) | ファイル受信、軽量パーサー(pdf-parse / xlsx / mammoth)、Gemini API コール、指標集計、期間抽出、履歴保存 |
| AI / OCR | Gemini 1.5 Flash (API キー設定時に使用) | 財務項目抽出・インサイト生成、PDF OCR 対応、期間比較分析 |

バックエンドはメモリストアで最新 20 件の履歴を保持し、フロントエンドは API (`/api/analyze`, `/api/history`, `/api/health`) を React Query でコールします。CSV/PDF エクスポートはフロントエンド側で jspdf を使用して実装しています。

## 主な機能

- 📁 **マルチファイルアップロード**: ドラッグ&ドロップ + 進捗表示、10 ファイル/100MB までを検証
- 🔎 **ファイル解析パイプライン**:
  - PDF: pdf-parse でテキスト抽出、失敗時は Gemini Vision API で OCR
  - Excel: xlsx ライブラリで最大3シート、各50行まで処理
  - Word: mammoth でテキスト抽出
  - CSV: 直接テキスト読み込み
- 🤖 **AI 財務分析**: Gemini API で主要4項目（売上高、販管費、経常利益、純利益）を自動抽出
- 📅 **期間自動検出**: ファイル名やテキストから「第XX期」「令和XX年」などを自動抽出し期間別に分類
- 📊 **多層ダッシュボード**:
  - エグゼクティブサマリー: 主要指標カードと変化率
  - 期間別比較: 複数期間のデータを横並びで比較表示
  - AI インサイト: 各期のトピックと全体サマリーを生成
  - ファイル別詳細: 各ファイルの解析結果とメトリクス
- 💾 **履歴管理**: 最新 20 件の分析結果をメモリ保持しタイムライン表示
- 📤 **エクスポート**: 指標 CSV / AI サマリー PDF をワンクリックでダウンロード

## セットアップ

### 1. 事前準備
- Node.js 20 以上
- (推奨) [Google Gemini API キー](https://makersuite.google.com/app/apikey)
  - 未設定の場合、メトリクスは0、インサイトは警告メッセージが表示されます
  - 設定すると主要財務項目の自動抽出と AI インサイト生成が有効化されます

### 2. 依存関係のインストール

```bash
# backend
cd backend
npm install

# frontend
cd frontend
npm install
```

### 3. 環境変数の設定

`backend/.env.example` を `backend/.env` にコピーし、Gemini API キーを設定します。

```bash
cd backend
cp .env.example .env
```

`backend/.env` の内容:

```ini
PORT=4000
ALLOWED_ORIGINS=http://localhost:5173
GEMINI_API_KEY=your-gemini-api-key-here  # ← ここに取得した API キーを設定
GEMINI_MODEL=gemini-1.5-flash
MAX_FILE_COUNT=10
MAX_TOTAL_BYTES=104857600  # 100MB
```

フロントエンドも同様に `.env` を作成（デフォルト設定のままでも動作）:

```bash
cd frontend
cp .env.example .env
```

`frontend/.env` の内容:

```ini
VITE_API_BASE_URL=http://localhost:4000/api
```

### 4. ローカル起動
別々のターミナルで以下を実行します。

```bash
# ターミナル1: backend
cd backend
npm run dev
# → http://localhost:4000 で起動

# ターミナル2: frontend
cd frontend
npm run dev
# → http://localhost:5173 で起動
```

ブラウザで [http://localhost:5173](http://localhost:5173) を開き、PDFファイルをアップロードして動作確認します。

### 5. 本番ビルド
```bash
# backend
cd backend
npm run build
# → backend/dist にビルド出力

# frontend
cd frontend
npm run build
# → frontend/dist にビルド出力
```

本番環境では:

- **フロントエンド**: S3 + CloudFront、Vercel、Netlify などの静的ホスティング
- **バックエンド**: AWS Lambda (SAM)、ECS/Fargate、Cloud Run などで稼働可能
  - SAM デプロイコマンドも用意済み: `npm run sam:deploy:fast`

## API エンドポイント

| メソッド | パス | 説明 |
| --- | --- | --- |
| `GET` | `/api/health` | 死活監視用エンドポイント（ヘルスチェック） |
| `GET` | `/api/history` | 最新 20 件の分析結果を返却（タイムスタンプ降順） |
| `POST` | `/api/analyze` | `multipart/form-data` で複数ファイルを送信し、分析サマリーを取得 |

**リクエスト例**:
```bash
curl -X POST http://localhost:4000/api/analyze \
  -F "files=@決算報告書_第20期.pdf" \
  -F "files=@決算報告書_第21期.pdf"
```

**レスポンス例**:
```json
{
  "requestId": "uuid",
  "generatedAt": "2025-11-12T12:34:56Z",
  "files": [...],
  "aggregatedMetrics": [...],
  "insights": [...],
  "comparisonSeries": {...},
  "periodSummaries": [...]
}
```

## 実装済み機能の詳細

### ファイルパーサー

- **PDF**: `pdf-parse` でテキスト抽出、抽出失敗時（50文字未満）は Gemini Vision API で OCR
- **Excel**: `xlsx` で最大3シート、各50行まで処理
- **Word**: `mammoth` でテキスト抽出
- **CSV**: 直接 UTF-8 テキストとして読み込み
- **PowerPoint / 画像**: 現在は空文字列を返す（将来拡張予定）

### AI 分析エンジン

#### 1. 財務項目抽出 (`geminiClient.ts`)

主要4項目を自動抽出:

- 売上高（売上、営業収益など）
- 販管費（販売費及び一般管理費など）
- 経常利益
- 純利益（当期純利益、税引後当期純利益など）

金額は「円」単位に自動変換（千円・百万円表記も対応）。

#### 2. 期間比較分析 (`periodComparisonClient.ts`)

2期以上のデータがある場合、以下を生成:

- **期別トピック**: 各期の重要トピック（1～2個/期）
- **全体サマリー**: 複数期間を通した総合評価（2～3個）

#### 3. 期間自動検出 (`periodExtractor.ts`)

ファイル名とテキストから以下を抽出:

- 期番号: 「第20期」→ 20
- 会計年度: 「令和06年」→ 2024年
- 期間日付: 「自 令和06年06月01日 至 令和07年05月31日」

### 履歴管理

- **メモリストア**: 最新 20 件を保持（`historyStore.ts`）
- **DynamoDB ストア**: 実装済み（`dynamodbHistoryStore.ts`）だが未使用
  - 環境変数 `DYNAMODB_TABLE_NAME` 設定で切り替え可能

## 今後の拡張候補

1. **永続化**: DynamoDB または RDS で履歴の長期保管（実装済み、環境変数で有効化可能）
2. **大容量対応**: S3 一時保管 + SQS キュー処理で 100MB 超のファイルに対応
3. **モデル多様化**: Claude / GPT-4 との併用でフェイルオーバー実装
4. **OCR 強化**: PowerPoint と画像ファイルの専用 OCR 処理
5. **通知機能**: 分析完了時に Slack / Teams へ通知
6. **比較強化**: 3期以上のトレンドグラフ、YoY/QoQ 自動計算
7. **認証**: Auth0 / Cognito でマルチユーザー対応

## プロジェクト構成

```
report-lens-ai/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── geminiClient.ts          # Gemini API：財務項目抽出
│   │   │   ├── geminiVision.ts          # Gemini Vision：PDF OCR
│   │   │   ├── periodComparisonClient.ts # 期間比較分析
│   │   │   ├── fileParser.ts            # ファイル解析（PDF/Excel/Word/CSV）
│   │   │   └── analysisService.ts       # 分析オーケストレーション
│   │   ├── handlers/
│   │   │   ├── analyze.ts               # POST /api/analyze
│   │   │   ├── history.ts               # GET /api/history
│   │   │   └── health.ts                # GET /api/health
│   │   ├── store/
│   │   │   ├── historyStore.ts          # メモリストア（デフォルト）
│   │   │   └── dynamodbHistoryStore.ts  # DynamoDB ストア（オプション）
│   │   ├── utils/
│   │   │   ├── periodExtractor.ts       # 期間情報抽出
│   │   │   ├── numberUtils.ts           # 数値計算・フォーマット
│   │   │   └── multipartParser.ts       # マルチパートリクエストパーサー
│   │   ├── types/
│   │   │   └── analysis.ts              # 型定義
│   │   ├── config.ts                    # 環境変数読み込み
│   │   └── index.ts                     # エントリーポイント
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadPanel.tsx          # ファイルアップロード UI
│   │   │   ├── ExecutiveSummary.tsx     # エグゼクティブサマリー
│   │   │   ├── PeriodComparison.tsx     # 期間別比較表示
│   │   │   ├── InsightsList.tsx         # AI インサイト一覧
│   │   │   ├── FileInsightPanel.tsx     # ファイル別詳細
│   │   │   ├── MetricCardGrid.tsx       # 指標カードグリッド
│   │   │   ├── ComparisonCharts.tsx     # 比較グラフ（Recharts）
│   │   │   ├── HistoryTimeline.tsx      # 履歴タイムライン
│   │   │   └── ExportButtons.tsx        # CSV/PDF エクスポート
│   │   ├── hooks/
│   │   │   └── useAnalysis.ts           # TanStack Query フック
│   │   ├── utils/
│   │   │   ├── exporters.ts             # CSV/PDF エクスポート処理
│   │   │   └── formatters.ts            # 数値・日付フォーマット
│   │   ├── api/
│   │   │   └── client.ts                # Axios API クライアント
│   │   ├── types/
│   │   │   └── analysis.ts              # 型定義
│   │   ├── App.tsx                      # メインコンポーネント
│   │   └── main.tsx                     # エントリーポイント
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── biome.json                       # Biome 設定（linter/formatter）
│   └── .env.example
│
├── README.md                            # このファイル
└── requirements.md                      # 元の要件定義
```

要件 (`requirements.md`) に記載された機能要件/非機能要件/リスク項目を初期スコープに合わせて実装済みです。

## 技術スタック詳細

### Backend

| カテゴリ | パッケージ | バージョン | 用途 |
|---------|----------|----------|------|
| ランタイム | Node.js | 20+ | サーバー実行環境 |
| フレームワーク | Express | 5.1.0 | Web フレームワーク |
| 言語 | TypeScript | 5.9.3 | 型安全な開発 |
| AI API | @google/generative-ai | 0.24.1 | Gemini API クライアント |
| ファイル解析 | pdf-parse | 2.4.5 | PDF テキスト抽出 |
| | xlsx | 0.18.5 | Excel ファイル解析 |
| | mammoth | 1.11.0 | Word ファイル解析 |
| | pdfjs-dist | 3.11.174 | PDF レンダリング（OCR 用） |
| | canvas | 3.2.0 | PDF レンダリング（OCR 用） |
| データ | @aws-sdk/client-dynamodb | 3.709.0 | DynamoDB クライアント |
| HTTP | axios | 1.13.2 | HTTP クライアント |
| バリデーション | zod | 4.1.12 | スキーマバリデーション |
| その他 | multer | 2.0.2 | マルチパートアップロード |
| | cors | 2.8.5 | CORS ミドルウェア |
| | uuid | 13.0.0 | UUID 生成 |

### Frontend

| カテゴリ | パッケージ | バージョン | 用途 |
|---------|----------|----------|------|
| フレームワーク | React | 19.2.0 | UI ライブラリ |
| ビルドツール | Vite | 7.2.2 | 高速ビルド |
| 言語 | TypeScript | 5.9.3 | 型安全な開発 |
| 状態管理 | @tanstack/react-query | 5.90.7 | サーバー状態管理 |
| HTTP | axios | 1.13.2 | HTTP クライアント |
| グラフ | recharts | 3.4.1 | データ可視化 |
| アイコン | lucide-react | 0.553.0 | アイコンコンポーネント |
| PDF 生成 | jspdf | 3.0.3 | PDF エクスポート |
| コード品質 | @biomejs/biome | 2.3.5 | Linter & Formatter |

## パフォーマンスとコスト

### 処理速度

- **ファイル解析**: 1ファイルあたり 1～5秒（PDF OCR 含む）
- **AI 分析**: 1リクエストあたり 2～10秒（Gemini API）
- **期間比較**: 2期以上で追加 3～5秒

### コスト試算（月間）

**Gemini 1.5 Flash 使用時**:

- テキスト入力: $0.075 / 1M tokens
- テキスト出力: $0.30 / 1M tokens

想定: 月200ファイル、1ファイル平均8,000 tokens（入力）+ 500 tokens（出力）

```text
入力コスト: 200 × 8,000 / 1,000,000 × $0.075 = $0.12
出力コスト: 200 × 500 / 1,000,000 × $0.30 = $0.03
合計: 約 $0.15/月 (約 20円/月)
```

**インフラコスト**:

- Lambda + API Gateway: 〜 $5/月（月1万リクエスト想定）
- S3 + CloudFront: 〜 $1/月

**合計**: 月額 5,000円以内で運用可能

## トラブルシューティング

### PDF のテキストが抽出できない

1. Gemini API キーが設定されているか確認
2. ログで "OCR with Gemini Vision API" が実行されているか確認
3. PDF が画像ベースの場合、OCR 処理に10秒以上かかる場合あり

### 期間が自動検出されない

ファイル名またはPDF内に以下の表記があるか確認:

- 「第XX期」形式
- 「令和XX年」形式
- 「YYYY年」形式

### エクスポートが動作しない

ブラウザのポップアップブロックを無効化してください。

### 履歴が消える

メモリストアを使用しているため、サーバー再起動で消えます。永続化が必要な場合は DynamoDB ストアを有効化してください。

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 貢献

Pull Request や Issue は歓迎します。大きな変更の場合は、まず Issue で議論してください。
