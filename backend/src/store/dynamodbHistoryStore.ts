import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import type { HistoryEntry } from '../types/analysis';

const MAX_HISTORY = 20;

export class DynamoDBHistoryStore {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor() {
    const client = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = process.env.HISTORY_TABLE_NAME || 'report-lens-history';
  }

  async save(entry: HistoryEntry): Promise<void> {
    const ttl = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days TTL

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          ...entry,
          ttl,
        },
      }),
    );
  }

  async all(): Promise<HistoryEntry[]> {
    const result = await this.docClient.send(
      new ScanCommand({
        TableName: this.tableName,
        Limit: MAX_HISTORY,
      }),
    );

    const items = (result.Items || []) as HistoryEntry[];

    // Sort by savedAt descending
    return items.sort((a, b) => {
      const dateA = new Date(a.savedAt).getTime();
      const dateB = new Date(b.savedAt).getTime();
      return dateB - dateA;
    });
  }

  async find(requestId: string): Promise<HistoryEntry | undefined> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'requestId = :requestId',
        ExpressionAttributeValues: {
          ':requestId': requestId,
        },
        Limit: 1,
      }),
    );

    const items = result.Items || [];
    return items.length > 0 ? (items[0] as HistoryEntry) : undefined;
  }
}

export const dynamodbHistoryStore = new DynamoDBHistoryStore();
