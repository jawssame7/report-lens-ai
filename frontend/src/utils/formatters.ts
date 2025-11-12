export const formatNumber = (value: number | undefined, unit?: string) => {
  if (value === undefined || Number.isNaN(value)) return '-';
  const formatter = new Intl.NumberFormat('ja-JP', {
    maximumFractionDigits: 2,
  });
  return `${formatter.format(value)}${unit ?? ''}`;
};

export const formatPercent = (value?: number) => {
  if (value === undefined || Number.isNaN(value)) return '-';
  return `${(value * 100).toFixed(1)}%`;
};

export const formatDirection = (direction: 'up' | 'down' | 'flat') => {
  switch (direction) {
    case 'up':
      return '▲';
    case 'down':
      return '▼';
    default:
      return '–';
  }
};

export const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = parseFloat((bytes / k ** i).toFixed(1));
  return `${value} ${sizes[i]}`;
};

export const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('ja-JP', { hour12: false });
