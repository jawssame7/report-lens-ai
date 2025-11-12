import path from 'node:path';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { extractTextFromDocument } from './geminiVision';

// pdf-parse is a CommonJS module, need to use require
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse') as {
  PDFParse: new (options: { data: Buffer }) => {
    getText(): Promise<{ text?: string }>;
  };
};

export interface ParsedFile {
  textContent: string;
  detectedMetrics: { label: string; value: number; unit?: string | undefined }[];
}

const numberPattern = /([-+]?\d{1,3}(?:[,\s]\d{3})*(?:\.\d+)?|[-+]?\d+(?:\.\d+)?)(\s?[%¥$€]?)/;

const sanitizeNumber = (value: string): number | undefined => {
  const normalized = value.replace(/[,\s]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const addMetricCandidate = (
  candidates: ParsedFile['detectedMetrics'],
  label: string,
  numericPart: string,
  unit?: string
): void => {
  const value = sanitizeNumber(numericPart);
  if (value === undefined) return;

  candidates.push({
    label: label.trim().slice(0, 80) || 'Metric',
    value,
    unit: unit?.trim() || undefined
  });
};

const harvestMetricsFromLines = (text: string): ParsedFile['detectedMetrics'] => {
  const lines = text.split(/\r?\n/);
  const candidates: ParsedFile['detectedMetrics'] = [];

  for (const line of lines) {
    const match = line.match(numberPattern);
    if (match) {
      const [, numeric = '', unit = ''] = match;
      const label = line.replace(numeric, '').replace(unit, '');
      addMetricCandidate(candidates, label, numeric, unit || undefined);
    }
  }

  return candidates.slice(0, 25);
};

const normalizeText = (text: string): string => {
  let normalized = text;

  // Remove spaces between Japanese characters (repeat until no more matches)
  let previous = '';
  while (previous !== normalized) {
    previous = normalized;
    normalized = normalized.replace(/([ぁ-んァ-ヶー一-龠々])\s+([ぁ-んァ-ヶー一-龠々])/g, '$1$2');
  }

  return normalized
    // Replace multiple spaces with single space
    .replace(/ {2,}/g, ' ')
    // Preserve intentional line breaks, remove excessive blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const readPdfWithOCR = async (buffer: Buffer): Promise<string> => {
  try {
    console.log('Attempting OCR with Gemini Vision API (direct PDF)...');

    // Convert Buffer to base64
    const pdfBase64 = buffer.toString('base64');
    const extractedText = await extractTextFromDocument(pdfBase64, 'application/pdf');

    console.log('OCR extracted text (first 200 chars):', extractedText.slice(0, 200));
    return extractedText;
  } catch (error) {
    console.error('OCR error', error);
    return '';
  }
};

const readPdf = async (buffer: Buffer): Promise<string> => {
  try {
    // First try text extraction
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const rawText = result.text || '';

    console.log('PDF raw text (first 200 chars):', rawText.slice(0, 200));

    // If no meaningful text extracted (only page markers or very short), use OCR
    const meaningfulText = rawText.replace(/--\s*\d+\s*of\s*\d+\s*--/g, '').trim();
    if (meaningfulText.length < 50) {
      console.log('Text extraction failed, falling back to OCR...');
      const ocrText = await readPdfWithOCR(buffer);
      return normalizeText(ocrText);
    }

    const normalizedText = normalizeText(rawText);
    console.log('PDF normalized text (first 200 chars):', normalizedText.slice(0, 200));

    return normalizedText;
  } catch (error) {
    console.error('PDF parse error', error);
    return '';
  }
};

const readExcel = (buffer: Buffer): string => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheets = workbook.SheetNames.slice(0, 3);
  const chunks: string[] = [];
  for (const name of sheets) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const rows: string[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: ''
    });
    rows.slice(0, 50).forEach((row) => chunks.push(row.join('\t')));
  }
  return chunks.join('\n');
};

const readDocx = async (buffer: Buffer): Promise<string> => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('DOCX parse error', error);
    return '';
  }
};

const readCsv = (buffer: Buffer): string => buffer.toString('utf-8');

const readPptx = (): string => '';
const readImage = (): string => '';

const isMime = (value: string | undefined, target: string): boolean =>
  value?.toLowerCase().includes(target) ?? false;

export const parseFile = async (file: Express.Multer.File): Promise<ParsedFile> => {
  const extension = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  let textContent = '';

  if (extension === '.pdf' || isMime(mime, 'pdf')) {
    textContent = await readPdf(file.buffer);
  } else if (['.xlsx', '.xls'].includes(extension) || isMime(mime, 'spreadsheet')) {
    textContent = readExcel(file.buffer);
  } else if (['.docx', '.doc'].includes(extension) || isMime(mime, 'word')) {
    textContent = await readDocx(file.buffer);
  } else if (['.csv', '.tsv'].includes(extension) || mime.includes('csv')) {
    textContent = readCsv(file.buffer);
  } else if (['.pptx', '.ppt'].includes(extension)) {
    textContent = readPptx();
  } else if (mime.startsWith('image/')) {
    textContent = readImage();
  } else {
    textContent = file.buffer.toString('utf-8');
  }

  const detectedMetrics = harvestMetricsFromLines(textContent);

  return {
    textContent,
    detectedMetrics
  };
};
