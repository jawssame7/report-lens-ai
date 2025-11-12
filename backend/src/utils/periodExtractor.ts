/**
 * ファイル名やテキストから期間情報を抽出
 */

export interface PeriodInfo {
  period: number | null; // 第20期 → 20
  fiscalYear: number | null; // 令和06年 → 2024
  displayName: string; // "第20期"
  startDate?: string;
  endDate?: string;
}

/**
 * ファイル名から期を抽出
 * 例: "決算報告書_第20期.pdf" → 20
 */
const extractPeriodFromFilename = (filename: string): number | null => {
  const periodMatch = filename.match(/第?(\d+)期/);
  if (periodMatch) {
    return parseInt(periodMatch[1], 10);
  }
  return null;
};

/**
 * テキストから期を抽出
 */
const extractPeriodFromText = (text: string): number | null => {
  const firstPart = text.slice(0, 500);
  const periodMatch = firstPart.match(/第(\d+)期/);
  if (periodMatch) {
    return parseInt(periodMatch[1], 10);
  }
  return null;
};

/**
 * 令和年号を西暦に変換
 */
const convertReiwaToYear = (reiwaYear: number): number => {
  return 2018 + reiwaYear; // 令和元年 = 2019年
};

/**
 * テキストから会計年度を抽出
 */
const extractFiscalYearFromText = (text: string): number | null => {
  const firstPart = text.slice(0, 1000);

  // 令和XX年XX月XX日形式
  const reiwaMatch = firstPart.match(/令和(\d+)年/);
  if (reiwaMatch) {
    const reiwaYear = parseInt(reiwaMatch[1], 10);
    return convertReiwaToYear(reiwaYear);
  }

  // YYYY年形式
  const yearMatch = firstPart.match(/(\d{4})年/);
  if (yearMatch) {
    return parseInt(yearMatch[1], 10);
  }

  return null;
};

/**
 * テキストから期間日付を抽出
 */
const extractDateRange = (text: string): { startDate?: string; endDate?: string } => {
  const firstPart = text.slice(0, 1000);
  const dateRange: { startDate?: string; endDate?: string } = {};

  // 自 令和06年06月01日 至 令和07年05月31日 形式
  const rangeMatch = firstPart.match(
    /自\s*令和(\d+)年(\d+)月(\d+)日\s*至\s*令和(\d+)年(\d+)月(\d+)日/
  );
  if (rangeMatch) {
    const [, startR, startM, startD, endR, endM, endD] = rangeMatch;
    const startYear = convertReiwaToYear(parseInt(startR, 10));
    const endYear = convertReiwaToYear(parseInt(endR, 10));
    dateRange.startDate = `${startYear}-${startM.padStart(2, '0')}-${startD.padStart(2, '0')}`;
    dateRange.endDate = `${endYear}-${endM.padStart(2, '0')}-${endD.padStart(2, '0')}`;
  }

  return dateRange;
};

/**
 * ファイルとテキストから期間情報を抽出
 */
export const extractPeriodInfo = (filename: string, textContent: string): PeriodInfo => {
  const period = extractPeriodFromFilename(filename) || extractPeriodFromText(textContent);
  const fiscalYear = extractFiscalYearFromText(textContent);
  const dateRange = extractDateRange(textContent);

  let displayName = 'その他';
  if (period !== null) {
    displayName = `第${period}期`;
  } else if (fiscalYear !== null) {
    displayName = `${fiscalYear}年度`;
  }

  return {
    period,
    fiscalYear,
    displayName,
    ...dateRange,
  };
};

/**
 * 期間情報をソートキーに変換
 */
export const getPeriodSortKey = (periodInfo: PeriodInfo): number => {
  // 期番号があればそれを使用
  if (periodInfo.period !== null) {
    return periodInfo.period;
  }

  // 会計年度があればそれを使用
  if (periodInfo.fiscalYear !== null) {
    return periodInfo.fiscalYear;
  }

  // どちらもなければ0
  return 0;
};
