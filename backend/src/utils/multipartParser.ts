import type { APIGatewayProxyEvent } from 'aws-lambda';

interface ParsedFile {
  filename: string;
  contentType: string;
  buffer: Buffer;
  size: number;
}

interface ParsedForm {
  fields: Record<string, string>;
  files: ParsedFile[];
}

/**
 * Parse multipart/form-data from API Gateway event
 */
export const parseMultipartForm = async (
  event: APIGatewayProxyEvent,
): Promise<ParsedForm> => {
  const contentType = event.headers['content-type'] || event.headers['Content-Type'];

  if (!contentType || !contentType.includes('multipart/form-data')) {
    throw new Error('Content-Type must be multipart/form-data');
  }

  // Extract boundary from content-type header
  const boundaryMatch = contentType.match(/boundary=(.+)$/);
  if (!boundaryMatch || !boundaryMatch[1]) {
    throw new Error('No boundary found in Content-Type header');
  }

  const boundary = boundaryMatch[1];
  const body = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64')
    : Buffer.from(event.body || '', 'utf-8');

  return parseMultipart(body, boundary);
};

/**
 * Parse multipart buffer
 */
const parseMultipart = (buffer: Buffer, boundary: string): ParsedForm => {
  const fields: Record<string, string> = {};
  const files: ParsedFile[] = [];

  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const parts = splitBuffer(buffer, boundaryBuffer);

  for (const part of parts) {
    if (part.length === 0) continue;

    // Find the double CRLF that separates headers from body
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;

    const headerSection = part.slice(0, headerEnd).toString('utf-8');
    const bodySection = part.slice(headerEnd + 4);

    // Remove trailing CRLF from body
    const body =
      bodySection[bodySection.length - 2] === 0x0d &&
      bodySection[bodySection.length - 1] === 0x0a
        ? bodySection.slice(0, -2)
        : bodySection;

    // Parse headers
    const headers = parseHeaders(headerSection);
    const disposition = headers['content-disposition'];

    if (!disposition) continue;

    const nameMatch = disposition.match(/name="([^"]+)"/);
    const filenameMatch = disposition.match(/filename="([^"]+)"/);

    if (filenameMatch?.[1] && nameMatch?.[1]) {
      // This is a file
      const filename = filenameMatch[1];
      const contentType = headers['content-type'] || 'application/octet-stream';

      files.push({
        filename,
        contentType,
        buffer: body,
        size: body.length,
      });
    } else if (nameMatch?.[1]) {
      // This is a regular field
      const fieldName = nameMatch[1];
      fields[fieldName] = body.toString('utf-8');
    }
  }

  return { fields, files };
};

/**
 * Split buffer by delimiter
 */
const splitBuffer = (buffer: Buffer, delimiter: Buffer): Buffer[] => {
  const parts: Buffer[] = [];
  let start = 0;

  while (start < buffer.length) {
    const index = buffer.indexOf(delimiter, start);
    if (index === -1) break;

    if (index > start) {
      parts.push(buffer.slice(start, index));
    }

    start = index + delimiter.length;
  }

  return parts;
};

/**
 * Parse header section into key-value pairs
 */
const parseHeaders = (headerSection: string): Record<string, string> => {
  const headers: Record<string, string> = {};
  const lines = headerSection.split('\r\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim().toLowerCase();
    const value = line.slice(colonIndex + 1).trim();
    headers[key] = value;
  }

  return headers;
};
