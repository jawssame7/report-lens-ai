# ReportLens AI Backend

AWS Lambda + API Gateway を使用したサーバーレスバックエンド

## 開発モード (ローカル)

### 必要な環境

- Node.js 20.x
- npm

### セットアップ

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.local を編集して Gemini API キーを設定

# 開発サーバー起動
npm run dev
```

開発サーバーは `http://localhost:4000` で起動します。

## AWS SAM デプロイ

詳細は [SAM_DEPLOYMENT.md](./SAM_DEPLOYMENT.md) を参照してください。

### クイックスタート

```bash
# 依存関係のインストール
npm install

# TypeScript ビルド
npm run build

# SAM ビルド
npm run sam:build

# AWS へデプロイ (初回)
npm run sam:deploy

# AWS へデプロイ (2回目以降)
npm run sam:deploy:fast
```

## API エンドポイント

### GET /api/health

ヘルスチェック

**レスポンス:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### GET /api/history

分析履歴の取得

**レスポンス:**
```json
{
  "entries": [...]
}
```

### POST /api/analyze

ファイルの分析

**リクエスト:**
- Content-Type: `multipart/form-data`
- フィールド: `files` (複数可)

**レスポンス:**
```json
{
  "requestId": "...",
  "generatedAt": "...",
  "files": [...],
  "aggregatedMetrics": [...],
  "insights": [...],
  "comparisonSeries": {...}
}
```

## プロジェクト構造

```
backend/
├── src/
│   ├── handlers/         # Lambda ハンドラー
│   │   ├── health.ts
│   │   ├── history.ts
│   │   └── analyze.ts
│   ├── routes/          # Express ルート (ローカル開発用)
│   ├── services/        # ビジネスロジック
│   ├── store/           # データストア
│   │   ├── historyStore.ts          # 統一インターフェース
│   │   └── dynamodbHistoryStore.ts  # DynamoDB 実装
│   ├── utils/           # ユーティリティ
│   │   └── multipartParser.ts       # Lambda 用フォームパーサー
│   └── index.ts         # Express サーバー (ローカル開発用)
├── template.yaml        # SAM テンプレート
├── samconfig.toml       # SAM 設定
└── env.json            # ローカルテスト用環境変数
```

## 環境変数

### 開発環境 (.env.local)

```env
PORT=4000
GEMINI_API_KEY=your-api-key
GEMINI_MODEL=gemini-1.5-flash
MAX_FILE_COUNT=10
MAX_TOTAL_BYTES=104857600
ALLOWED_ORIGINS=http://localhost:5173
```

### AWS Lambda (template.yaml で設定)

- `GEMINI_API_KEY`: Gemini API キー
- `GEMINI_MODEL`: 使用するモデル
- `MAX_FILE_COUNT`: 最大ファイル数
- `MAX_TOTAL_BYTES`: 最大合計サイズ
- `ALLOWED_ORIGINS`: CORS 許可オリジン
- `HISTORY_TABLE_NAME`: DynamoDB テーブル名

## ライセンス

ISC
