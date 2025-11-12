import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { historyStore } from '../store/historyStore';

export const handler = async (
  _event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const entries = historyStore.all();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ entries }),
    };
  } catch (error) {
    console.error('Error fetching history:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'サーバーエラーが発生しました。',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
