import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { parseMultipartForm } from '../utils/multipartParser';
import { analyzeFiles } from '../services/analysisService';
import { serverConfig } from '../config';

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    // Parse multipart form data
    const { files } = await parseMultipartForm(event);

    if (!files || files.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'ファイルを少なくとも 1 つ選択してください。',
        }),
      };
    }

    if (files.length > serverConfig.upload.maxFileCount) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: `最大 ${serverConfig.upload.maxFileCount} ファイルまでアップロード可能です。`,
        }),
      };
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > serverConfig.upload.maxTotalBytes) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: '合計 100MB を超えるファイルはアップロードできません。',
        }),
      };
    }

    // Convert to Express.Multer.File format for compatibility
    const multerFiles: Express.Multer.File[] = files.map((file) => ({
      fieldname: 'files',
      originalname: file.filename,
      encoding: '7bit',
      mimetype: file.contentType,
      buffer: file.buffer,
      size: file.size,
      stream: null as any,
      destination: '',
      filename: file.filename,
      path: '',
    }));

    const summary = await analyzeFiles({ files: multerFiles });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(summary),
    };
  } catch (error) {
    console.error('Error analyzing files:', error);
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
