import { HistoryEntry } from '../types/analysis';
import { dynamodbHistoryStore } from './dynamodbHistoryStore';

const MAX_HISTORY = 20;

// In-memory store for local development
class InMemoryHistoryStore {
  private entries: HistoryEntry[] = [];

  async save(entry: HistoryEntry): Promise<void> {
    this.entries.unshift(entry);
    if (this.entries.length > MAX_HISTORY) {
      this.entries = this.entries.slice(0, MAX_HISTORY);
    }
  }

  async all(): Promise<HistoryEntry[]> {
    return this.entries;
  }

  async find(requestId: string): Promise<HistoryEntry | undefined> {
    return this.entries.find((entry) => entry.requestId === requestId);
  }
}

// Export the appropriate store based on environment
const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
export const historyStore = isLambda
  ? dynamodbHistoryStore
  : new InMemoryHistoryStore();
