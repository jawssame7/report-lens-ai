# AWS SAM Deployment Guide

このガイドでは、ReportLens AI バックエンドを AWS Lambda + API Gateway にデプロイする方法を説明します。

## 前提条件

1. **AWS CLI のインストール**
   ```bash
   # macOS
   brew install awscli

   # または公式インストーラー
   # https://aws.amazon.com/cli/
   ```

2. **AWS SAM CLI のインストール**
   ```bash
   # macOS
   brew install aws-sam-cli

   # または公式インストーラー
   # https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html
   ```

3. **AWS 認証情報の設定**
   ```bash
   aws configure
   # AWS Access Key ID, Secret Access Key, Region を入力
   ```

4. **Node.js 20.x のインストール**
   ```bash
   # macOS
   brew install node@20
   ```

## ローカル開発

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`env.json` を編集して、Gemini API キーを設定します：

```json
{
  "AnalyzeFunction": {
    "GEMINI_API_KEY": "your-actual-api-key-here"
  }
}
```

### 3. SAM ビルド

```bash
npm run sam:build
```

### 4. ローカルでAPIを起動

```bash
npm run sam:local
```

API は `http://localhost:3000` で利用可能になります。

### 5. ローカルテスト

```bash
# Health check
curl http://localhost:3000/api/health

# History
curl http://localhost:3000/api/history
```

## AWS へのデプロイ

### 初回デプロイ (ガイド付き)

```bash
npm run sam:deploy
```

以下の情報を入力します：
- **Stack Name**: `report-lens-ai` (デフォルト)
- **AWS Region**: `ap-northeast-1` (東京リージョン)
- **GeminiApiKey**: Gemini API キー
- **AllowedOrigins**: フロントエンドのURL (例: `https://your-frontend-domain.com`)

### 2回目以降のデプロイ (高速)

設定が `samconfig.toml` に保存されているため、以下のコマンドで高速デプロイできます：

```bash
npm run sam:deploy:fast
```

## デプロイ後の確認

1. **API エンドポイントの確認**

   デプロイ完了後、Outputs に API エンドポイントが表示されます：

   ```
   Outputs
   -------
   ApiEndpoint: https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/
   ```

2. **エンドポイントのテスト**

   ```bash
   curl https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/api/health
   ```

## フロントエンドの設定

フロントエンドの `.env` ファイルに API エンドポイントを設定します：

```env
VITE_API_BASE_URL=https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod
```

## トラブルシューティング

### Lambda のログを確認

```bash
sam logs -n AnalyzeFunction --stack-name report-lens-ai --tail
```

### DynamoDB テーブルの確認

```bash
aws dynamodb describe-table --table-name report-lens-ai-history
```

### スタックの削除

```bash
sam delete --stack-name report-lens-ai
```

## アーキテクチャ

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  API Gateway    │
└──────┬──────────┘
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌─────────────┐    ┌─────────────┐
│   Health    │    │   History   │
│  Function   │    │  Function   │
└─────────────┘    └──────┬──────┘
                          │
       ┌──────────────────┘
       │
       ▼
┌─────────────┐    ┌─────────────┐
│  Analyze    │───▶│  DynamoDB   │
│  Function   │    │   History   │
└──────┬──────┘    └─────────────┘
       │
       ▼
┌─────────────┐
│ Gemini API  │
└─────────────┘
```

## コスト見積もり

- **API Gateway**: リクエスト数に応じて課金
- **Lambda**: 実行時間とメモリに応じて課金
- **DynamoDB**: Pay-per-request モード
- **無料利用枠**: 月間 100万リクエストまで無料

詳細は [AWS 料金](https://aws.amazon.com/pricing/) を参照してください。
