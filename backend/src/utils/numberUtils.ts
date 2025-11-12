export const toPercent = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.round(value * 1000) / 10;
};

export interface ChangeComputation {
  changeAbsolute?: number | undefined;
  changeRate?: number | undefined;
  direction: 'flat' | 'up' | 'down';
}

export const calculateChange = (current: number, previous?: number): ChangeComputation => {
  if (previous === undefined || previous === 0) {
    return {
      changeAbsolute: previous === undefined ? undefined : current - previous,
      changeRate: undefined,
      direction: 'flat' as const
    };
  }

  const changeAbsolute = current - previous;
  const changeRate = changeAbsolute / Math.abs(previous);
  const direction: ChangeComputation['direction'] =
    changeAbsolute === 0 ? 'flat' : changeAbsolute > 0 ? 'up' : 'down';

  return {
    changeAbsolute,
    changeRate,
    direction
  };
};
